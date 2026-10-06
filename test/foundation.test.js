import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import app from '../server/app.js';
import { connectDb } from '../server/db.js';
import { Owner, Session, Product, LoginAttempt } from '../server/models.js';
import { hashPassword, verifyPassword } from '../server/security.js';
let database, server, base;
const origin = 'http://localhost:5173';
const password = 'test-owner-password-123';
before(async () => {
  const localBinary = resolve('node_modules/.cache/phase1-mongo/mongod.exe');
  database = await MongoMemoryServer.create(existsSync(localBinary) ? { binary: { systemBinary: localBinary } } : {});
  process.env.MONGODB_URI = database.getUri(); process.env.MONGODB_DB = 'foundation_test'; process.env.APP_ORIGIN = origin;
  await connectDb(); await Promise.all([Owner.init(), Session.init(), LoginAttempt.init()]);
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
