import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server-core';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import app from '../server/app.js';
import { connectDb } from '../server/db.js';
import { Owner, Session, Product, LoginAttempt, Cart, Order } from '../server/models.js';
import { digest, hashPassword, verifyPassword } from '../server/security.js';
let database, server, base;
const origin = 'http://localhost:5173';
const password = 'test-owner-password-123';
before(async () => {
  const localBinary = resolve('node_modules/.cache/phase1-mongo/mongod.exe');
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 }, ...(existsSync(localBinary) ? { binary: { systemBinary: localBinary } } : {}) });
  process.env.MONGODB_URI = database.getUri(); process.env.MONGODB_DB = 'foundation_test'; process.env.APP_ORIGIN = origin;
  await connectDb(); await Promise.all([Owner.init(), Session.init(), LoginAttempt.init(), Product.init(), Cart.init(), Order.init()]);
  await Owner.create({ email: 'owner@example.test', passwordHash: await hashPassword(password) });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await database?.stop(); });
async function request(path, { method = 'GET', body, cookie, requestOrigin = origin } = {}) {
  return fetch(`${base}/api${path}`, { method, headers: { 'Content-Type': 'application/json', Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
test('health verifies MongoDB and model validation enforces fixed categories and integer money', async () => {
  assert.equal((await request('/health')).status, 200);
  await assert.rejects(new Product({ name: 'Sample', description: 'Sample', category: 'Other', price: 1.5, stock: -1 }).validate());
  await assert.rejects(new Owner({ email: 'another@example.test', passwordHash: 'sample' }).save(), error => error.code === 11000);
});
test('password hashing rejects incorrect passwords', async () => {
  const hash = await hashPassword(password);
  assert.ok(!hash.includes(password)); assert.equal(await verifyPassword(password, hash), true); assert.equal(await verifyPassword('wrong', hash), false);
});
test('database reconnects after disconnect and shares concurrent connection attempts', async () => {
  await mongoose.disconnect();
  await Promise.all([connectDb(), connectDb(), connectDb()]);
  assert.equal(mongoose.connection.readyState, 1);
  await mongoose.connection.db.admin().ping();
  assert.equal((await request('/health')).status, 200);
});
test('owner access requires a valid session; login, expiry, revocation, and CSRF checks work', async () => {
  assert.equal((await request('/owner/session')).status, 401);
  assert.equal((await request('/owner/products')).status, 401);
  assert.equal((await request('/owner/session', { method: 'POST', body: { email: 'owner@example.test', password }, requestOrigin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/owner/session', { method: 'POST', body: { email: { $ne: null }, password } })).status, 400);
  const login = await request('/owner/session', { method: 'POST', body: { email: 'owner@example.test', password } });
  assert.equal(login.status, 200);
  const header = login.headers.get('set-cookie'); assert.match(header, /HttpOnly/i); assert.match(header, /SameSite=Strict/i); assert.match(header, /Max-Age=/i);
  const cookie = header.split(';')[0];
  const stored = await Session.findOne({ kind: 'owner' }); assert.notEqual(stored.tokenHash, cookie.split('=')[1]);
  assert.equal((await request('/owner/session', { cookie })).status, 200);
  assert.equal((await request('/owner/session', { method: 'DELETE', cookie })).status, 204);
  assert.equal((await request('/owner/session', { cookie })).status, 401);
  const again = await request('/owner/session', { method: 'POST', body: { email: 'owner@example.test', password } });
  await Session.updateMany({ kind: 'owner' }, { expiresAt: new Date(0) });
  assert.equal((await request('/owner/session', { cookie: again.headers.get('set-cookie').split(';')[0] })).status, 401);
});
test('customer identity uses a session cookie and reuses the current session', async () => {
  const first = await request('/customer/session'); assert.equal(first.status, 200);
  const header = first.headers.get('set-cookie'); assert.match(header, /HttpOnly/i); assert.doesNotMatch(header, /Max-Age|Expires/i);
  const second = await request('/customer/session', { cookie: header.split(';')[0] }); assert.equal(second.headers.get('set-cookie'), null);
});
test('sign-in throttling persists in MongoDB and returns retry guidance', async () => {
  for (let index = 0; index < 5; index++) assert.equal((await request('/owner/session', { method: 'POST', body: { email: 'unknown@example.test', password: 'wrong' } })).status, 401);
  const blocked = await request('/owner/session', { method: 'POST', body: { email: 'unknown@example.test', password: 'wrong' } });
  assert.equal(blocked.status, 429); assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});
test('production cookies are Secure', async () => {
  process.env.NODE_ENV = 'production';
  try { assert.match((await request('/customer/session')).headers.get('set-cookie'), /Secure/); }
  finally { delete process.env.NODE_ENV; }
});
test('Vercel Blob completion requests get past browser Origin checks', async () => {
  const existing = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  try {
    assert.equal((await request('/owner/product-image-upload', { method: 'POST', requestOrigin: 'https://vercel.example', body: { type: 'blob.upload-completed' } })).status, 503);
    assert.equal((await request('/owner/product-image-upload', { method: 'POST', requestOrigin: 'https://vercel.example', body: { type: 'blob.generate-client-token' } })).status, 403);
  } finally { if (existing !== undefined) process.env.BLOB_READ_WRITE_TOKEN = existing; }
});
test('catalog filters, session cart, transactional checkout, idempotent retry, and cancellation restore stock once', async () => {
  const product = await Product.create({ name: 'Sample loaf', description: 'Sample bakery item', category: 'Bread', price: 125, stock: 2, sample: true });
  const catalog = await request('/products?category=Bread&search=loaf');
  assert.equal((await catalog.json()).products.length, 1);
  const session = await request('/customer/session');
  const customerCookie = session.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/cart/items', { method: 'POST', cookie: customerCookie, body: { productId: String(product._id), quantity: 2 } })).status, 200);
  const cart = await request('/cart', { cookie: customerCookie });
  assert.equal((await cart.json()).total, 250);
  // Ask the API for tomorrow's date from its configured bakery timezone.
  const tomorrowKey = new Intl.DateTimeFormat('en-CA', { timeZone: process.env.BAKERY_TIMEZONE || 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const tomorrow = await (await request(`/pickup-slots?date=${tomorrowKey}`)).json();
  assert.equal(tomorrow.slots.length, 8); // No next-day cutoff: every 30-minute slot remains available.
  const input = { customerName: 'Sample Customer', phone: '+201234567890', pickupAt: tomorrow.slots[0].pickupAt, idempotencyKey: 'checkout-retry-00001' };
  const placed = await request('/orders', { method: 'POST', cookie: customerCookie, body: input });
  assert.equal(placed.status, 201);
  const order = (await placed.json()).order;
  assert.equal(order.total, 250); assert.equal(order.items[0].name, 'Sample loaf');
  assert.equal((await Product.findById(product._id)).stock, 0);
  const retry = await request('/orders', { method: 'POST', cookie: customerCookie, body: input });
  assert.equal((await retry.json()).order.orderNumber, order.orderNumber);
  assert.equal((await request(`/orders/${order.orderNumber}`, { cookie: customerCookie })).status, 200);
  assert.equal((await request(`/orders/${order.orderNumber}`, { cookie: (await request('/customer/session')).headers.get('set-cookie')?.split(';')[0] })).status, 404);
  await Order.updateOne({ _id: order._id }, { $set: { status: 'Ready' } });
  assert.equal((await request(`/orders/${order.orderNumber}/cancel`, { method: 'POST', cookie: customerCookie })).status, 200);
  assert.equal((await Product.findById(product._id)).stock, 2);
  await request(`/orders/${order.orderNumber}/cancel`, { method: 'POST', cookie: customerCookie });
  assert.equal((await Product.findById(product._id)).stock, 2);
});
test('owner product management and order status enforce permissions and valid transitions', async () => {
  assert.equal((await request('/owner/products', { method: 'POST', body: {} })).status, 401);
  const login = await request('/owner/session', { method: 'POST', body: { email: 'owner@example.test', password } });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const created = await request('/owner/products', { method: 'POST', cookie, body: { name: 'Sample pastry', description: 'Sample content.', category: 'Pastries', price: 99, stock: 3 } });
  assert.equal(created.status, 201);
  const product = (await created.json()).product;
  assert.equal((await request(`/owner/products/${product._id}`, { method: 'PATCH', cookie, body: { stock: 0 } })).status, 400);
  assert.equal((await request(`/owner/products/${product._id}/restock`, { method: 'POST', cookie, body: { quantity: 2 } })).status, 200);
  assert.equal((await Product.findById(product._id)).stock, 5);
  await Product.updateOne({ _id: product._id }, { $set: { stock: 3 } });
  const customerCookie = (await request('/customer/session')).headers.get('set-cookie').split(';')[0];
  await request('/cart/items', { method: 'POST', cookie: customerCookie, body: { productId: product._id, quantity: 1 } });
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: process.env.BAKERY_TIMEZONE || 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const slots = await (await request(`/pickup-slots?date=${date}`)).json();
  const placed = await request('/orders', { method: 'POST', cookie: customerCookie, body: { customerName: 'Sample Customer', phone: '12345678901', pickupAt: slots.slots[0].pickupAt, idempotencyKey: 'owner-status-check-0001' } });
  const order = (await placed.json()).order;
  assert.equal((await request(`/owner/orders/${order._id}/status`, { method: 'PATCH', cookie, body: { status: 'Picked up' } })).status, 409);
  assert.equal((await request(`/owner/orders/${order._id}/status`, { method: 'PATCH', cookie, body: { status: 'Ready' } })).status, 200);
  assert.equal((await request(`/owner/orders/${order._id}/status`, { method: 'PATCH', cookie, body: { status: 'Picked up' } })).status, 200);
  assert.equal((await request(`/owner/products/${product._id}/archive`, { method: 'POST', cookie })).status, 200);
  assert.equal((await Product.findById(product._id)).active, false);
  assert.equal((await request('/cart/items', { method: 'POST', cookie: customerCookie, body: { productId: product._id, quantity: 1 } })).status, 409);
  await Cart.updateOne({ sessionHash: digest(customerCookie.split('=')[1]) }, { $set: { items: [{ productId: product._id, quantity: 1 }] } }, { upsert: true });
  assert.equal((await request(`/cart/items/${product._id}`, { method: 'DELETE', cookie: customerCookie })).status, 204);
});
test('concurrent checkout cannot oversell the last unit', async () => {
  const product = await Product.create({ name: 'Sample final loaf', description: 'Sample content.', category: 'Bread', price: 100, stock: 1, sample: true });
  const sessions = await Promise.all([request('/customer/session'), request('/customer/session')]);
  const cookies = sessions.map(response => response.headers.get('set-cookie').split(';')[0]);
  for (const cookie of cookies) assert.equal((await request('/cart/items', { method: 'POST', cookie, body: { productId: String(product._id), quantity: 1 } })).status, 200);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: process.env.BAKERY_TIMEZONE || 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const slots = await (await request(`/pickup-slots?date=${date}`)).json();
  const outcomes = await Promise.all(cookies.map((cookie, index) => request('/orders', { method: 'POST', cookie, body: { customerName: 'Sample Customer', phone: '12345678901', pickupAt: slots.slots[0].pickupAt, idempotencyKey: `race-order-check-${index}-00001` } })));
  assert.deepEqual(outcomes.map(response => response.status).sort(), [201, 409]);
  assert.equal((await Product.findById(product._id)).stock, 0);
});
