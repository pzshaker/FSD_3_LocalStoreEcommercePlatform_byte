import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { randomInt } from 'node:crypto';
import { handleUpload } from '@vercel/blob/client';
import { connectDb } from './db.js';
import { Owner, Session, LoginAttempt, Product, Cart, Order, categories } from './models.js';
import { digest, token, verifyPassword, hashPassword, fail, credentials, cookieOptions } from './security.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = process.env.APP_ORIGIN;
    if (!origin || req.get('origin') !== origin) return next(fail(403, 'ORIGIN_REJECTED', 'This request is not permitted.'));
  }
  next();
});
app.get('/api/health', async (req, res) => {
  try { await connectDb(); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable. Check the server configuration.' } }); }
});
app.use('/api', async (req, res, next) => { await connectDb(); next(); });
app.post('/api/owner/session', async (req, res) => {
  const { email, password } = credentials(req.body);
  // Shared MongoDB counters work across Vercel instances; do not trust arbitrary proxy headers.
  const key = digest(`email:${email}`);
  const now = new Date();
  await LoginAttempt.deleteOne({ key, expiresAt: { $lte: now } });
  const attempt = await LoginAttempt.findOneAndUpdate({ key }, {
    $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
  }, { upsert: true, returnDocument: 'after' });
  if (attempt.count > 5) { res.set('Retry-After', String(Math.max(1, Math.ceil((attempt.expiresAt - now) / 1000)))); throw fail(429, 'RATE_LIMITED', 'Too many sign-in attempts. Try again later.'); }
  const owner = await Owner.findOne({ email }).select('+passwordHash');
  const fallback = await (dummyHash ??= hashPassword(token()));
  const valid = await verifyPassword(password, owner?.passwordHash || fallback);
  if (!owner || !valid) throw fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  const value = token();
  await Session.create({ tokenHash: digest(value), kind: 'owner', ownerId: owner._id, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) });
  if (typeof req.cookies.owner_session === 'string' && /^[a-f0-9]{64}$/.test(req.cookies.owner_session)) await Session.deleteOne({ tokenHash: digest(req.cookies.owner_session), kind: 'owner' });
  res.cookie('owner_session', value, { ...cookieOptions(), maxAge: 8 * 60 * 60 * 1000 });
  res.json({ owner: { email: owner.email } });
});
let dummyHash;
app.post('/api/owner/product-image-upload', async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw fail(503, 'IMAGE_STORAGE_UNAVAILABLE', 'Product image storage is not configured.');
  try {
    res.json(await handleUpload({ body: req.body, request: req, onBeforeGenerateToken: async () => {
      const value = req.cookies.owner_session;
      if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value) || !await Session.exists({ tokenHash: digest(value), kind: 'owner', expiresAt: { $gt: new Date() } })) throw fail(401, 'OWNER_SESSION_REQUIRED', 'Sign in to continue.');
      return { allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: true };
    }, onUploadCompleted: async () => {} }));
  } catch (error) { if (error.status) throw error; throw fail(400, 'INVALID_IMAGE_UPLOAD', 'Choose a JPEG, PNG, or WebP image under 5 MB.'); }
});
app.use('/api/owner', async (req, res, next) => {
  const value = req.cookies.owner_session;
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw fail(401, 'OWNER_SESSION_REQUIRED', 'Sign in to continue.');
  const session = await Session.findOne({ tokenHash: digest(value), kind: 'owner', expiresAt: { $gt: new Date() } });
  const owner = session && await Owner.findById(session.ownerId);
  if (!owner) throw fail(401, 'OWNER_SESSION_REQUIRED', 'Your session has expired. Sign in again.');
  req.owner = owner; next();
});
app.get('/api/owner/session', (req, res) => res.json({ owner: { email: req.owner.email } }));
app.delete('/api/owner/session', async (req, res) => {
  await Session.deleteOne({ tokenHash: digest(req.cookies.owner_session), kind: 'owner' });
  res.clearCookie('owner_session', cookieOptions()).status(204).end();
});
app.get('/api/customer/session', async (req, res) => {
  const value = req.cookies.customer_session;
  const session = typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) && await Session.findOne({ tokenHash: digest(value), kind: 'customer' });
  if (!session) {
    const nextValue = token();
    await Session.create({ tokenHash: digest(nextValue), kind: 'customer' });
    // No Max-Age or Expires: browser-session cookie, not persistent customer login.
    res.cookie('customer_session', nextValue, cookieOptions());
  }
  res.json({ session: 'active' });
});
async function customer(req, res, next) {
  const value = req.cookies.customer_session;
  let session = typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) && await Session.findOne({ tokenHash: digest(value), kind: 'customer' });
  if (!session) {
    const nextValue = token();
    session = await Session.create({ tokenHash: digest(nextValue), kind: 'customer' });
    res.cookie('customer_session', nextValue, cookieOptions());
  }
  req.sessionHash = session.tokenHash;
  next();
}
const timezone = () => process.env.BAKERY_TIMEZONE || 'Africa/Cairo';
const dateKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone(), year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
function zonedDateTime(key, hour, minute) {
  const [year, month, day] = key.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: timezone(), year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(guess)).map(part => [part.type, part.value]));
    guess += target - Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  }
  return new Date(guess);
}
function validDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10) === value;
}
app.get('/api/products', async (req, res) => {
  const filter = { active: true };
  if (req.query.category) {
    if (!categories.includes(req.query.category)) throw fail(400, 'INVALID_CATEGORY', 'Choose one of the available categories.');
    filter.category = req.query.category;
  }
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  if (search) filter.$or = ['name', 'description'].map(field => ({ [field]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }));
  res.json({ products: await Product.find(filter).sort({ category: 1, name: 1 }).lean() });
});
app.get('/api/products/:productId', async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.productId)) throw fail(404, 'PRODUCT_NOT_FOUND', 'This product is not available.');
  const product = await Product.findOne({ _id: req.params.productId, active: true }).lean();
  if (!product) throw fail(404, 'PRODUCT_NOT_FOUND', 'This product is not available.');
  res.json({ product });
});
app.get('/api/pickup-slots', (req, res) => {
  const today = dateKey();
  const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  if (req.query.date === undefined) return res.json({ timezone: timezone(), dates: { today, tomorrow } });
  const key = req.query.date === 'today' ? today : req.query.date === 'tomorrow' ? tomorrow : req.query.date;
  if (![today, tomorrow].includes(key)) throw fail(400, 'INVALID_PICKUP_DATE', 'Choose today or tomorrow.');
  const slots = Array.from({ length: 8 }, (_, index) => zonedDateTime(key, 8, index * 30));
  const available = key === today ? slots.filter(slot => slot.getTime() >= Date.now() + 60 * 60 * 1000) : slots;
  res.json({ date: key, timezone: timezone(), slots: available.map(pickupAt => ({ pickupAt: pickupAt.toISOString(), label: new Intl.DateTimeFormat('en', { timeZone: timezone(), hour: 'numeric', minute: '2-digit' }).format(pickupAt) })) });
});
app.get('/api/cart', customer, async (req, res) => {
  const cart = await Cart.findOne({ sessionHash: req.sessionHash }).lean();
  const ids = cart?.items.map(item => item.productId) ?? [];
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map(product => [String(product._id), product]));
  const items = (cart?.items ?? []).map(item => ({ productId: item.productId, product: byId.get(String(item.productId)) ?? null, quantity: item.quantity, available: !!byId.get(String(item.productId))?.active && byId.get(String(item.productId)).stock >= item.quantity }));
  res.json({ items, total: items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0) });
});
async function changeCart(req, productId, quantity) {
  if (!/^[a-f\d]{24}$/i.test(productId)) throw fail(404, 'PRODUCT_NOT_FOUND', 'This product is not available.');
  const product = quantity === null ? null : await Product.findOne({ _id: productId, active: true });
  if (quantity !== null && !product) throw fail(409, 'PRODUCT_UNAVAILABLE', 'This product is no longer available.');
  let cart = await Cart.findOne({ sessionHash: req.sessionHash });
  if (!cart) cart = new Cart({ sessionHash: req.sessionHash, items: [] });
  const index = cart.items.findIndex(item => String(item.productId) === productId);
  if (quantity === null) { if (index >= 0) cart.items.splice(index, 1); }
  else {
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw fail(400, 'INVALID_QUANTITY', 'Quantity must be a positive whole number.');
    if (quantity > product.stock) throw fail(409, 'INSUFFICIENT_STOCK', `${product.name} has ${product.stock} available.`);
    if (index >= 0) cart.items[index].quantity = quantity;
    else cart.items.push({ productId, quantity });
  }
  await cart.save();
  return cart;
}
app.post('/api/cart/items', customer, async (req, res) => {
  const quantity = req.body?.quantity;
  const cart = await Cart.findOne({ sessionHash: req.sessionHash });
  const existing = cart?.items.find(item => String(item.productId) === req.body?.productId)?.quantity ?? 0;
  await changeCart(req, req.body?.productId, existing + quantity);
  res.status(200).json({ cart: await Cart.findOne({ sessionHash: req.sessionHash }).lean() });
});
app.patch('/api/cart/items/:productId', customer, async (req, res) => { await changeCart(req, req.params.productId, req.body?.quantity); res.json({ cart: await Cart.findOne({ sessionHash: req.sessionHash }).lean() }); });
app.delete('/api/cart/items/:productId', customer, async (req, res) => { await changeCart(req, req.params.productId, null); res.status(204).end(); });
app.post('/api/orders', customer, async (req, res) => {
  const { customerName, phone, pickupAt, idempotencyKey } = req.body ?? {};
  if (typeof customerName !== 'string' || customerName.trim().length < 1 || customerName.trim().length > 120 || typeof phone !== 'string' || !/^\+?[\d ()-]{7,24}$/.test(phone.trim()) || typeof idempotencyKey !== 'string' || !/^[\w-]{16,100}$/.test(idempotencyKey) || typeof pickupAt !== 'string' || !Number.isFinite(Date.parse(pickupAt))) throw fail(400, 'INVALID_ORDER', 'Enter a name, valid phone number, pickup time, and retry key.');
  const key = `${req.sessionHash}:${idempotencyKey}`;
  const prior = await Order.findOne({ idempotencyKey: key });
  if (prior) return res.status(200).json({ order: prior });
  const requestedAt = new Date(pickupAt);
  const day = dateKey(requestedAt);
  const slots = (await (async () => {
    const today = dateKey(); const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    if (![today, tomorrow].includes(day)) return [];
    const valid = Array.from({ length: 8 }, (_, index) => zonedDateTime(day, 8, index * 30));
    return day === today ? valid.filter(slot => slot.getTime() >= Date.now() + 60 * 60 * 1000) : valid;
  })());
  if (!slots.some(slot => slot.getTime() === requestedAt.getTime())) throw fail(400, 'PICKUP_UNAVAILABLE', 'Choose an available pickup time.');
  const cart = await Cart.findOne({ sessionHash: req.sessionHash }).lean();
  if (!cart?.items.length) throw fail(409, 'CART_EMPTY', 'Add an available product before placing your order.');
  const session = await Order.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const productIds = cart.items.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds }, active: true }).session(session);
      const byId = new Map(products.map(product => [String(product._id), product]));
      const snapshots = [];
      for (const item of cart.items) {
        const product = byId.get(String(item.productId));
        if (!product || product.stock < item.quantity) throw fail(409, 'INSUFFICIENT_STOCK', `${product?.name ?? 'A cart item'} is no longer available in that quantity.`);
        const updated = await Product.updateOne({ _id: product._id, active: true, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { session });
        if (updated.modifiedCount !== 1) throw fail(409, 'INSUFFICIENT_STOCK', `${product.name} is no longer available in that quantity.`);
        snapshots.push({ productId: product._id, name: product.name, unitPrice: product.price, quantity: item.quantity });
      }
      const total = snapshots.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      if (!Number.isSafeInteger(total)) throw fail(400, 'INVALID_TOTAL', 'The order total exceeds the supported limit.');
      order = await Order.create([{ orderNumber: `SAMPLE-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 10000)}`, sessionHash: req.sessionHash, idempotencyKey: key, customerName: customerName.trim(), phone: phone.trim(), pickupAt: requestedAt, items: snapshots, total }], { session }).then(([created]) => created);
      await Cart.updateOne({ sessionHash: req.sessionHash }, { $set: { items: [] } }, { session });
    });
  } catch (error) {
    if (error.code === 11000) { const duplicate = await Order.findOne({ idempotencyKey: key }); if (duplicate) return res.status(200).json({ order: duplicate }); }
    throw error;
  } finally { await session.endSession(); }
  res.status(201).json({ order, timezone: timezone(), cancellationCutoff: new Date(requestedAt.getTime() - 6 * 60 * 60 * 1000) });
});
app.get('/api/orders/:orderNumber', customer, async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, sessionHash: req.sessionHash }).lean();
  if (!order) throw fail(404, 'ORDER_NOT_FOUND', 'This confirmation is not available in this browser session.');
  res.json({ order, timezone: timezone(), cancellationCutoff: new Date(order.pickupAt.getTime() - 6 * 60 * 60 * 1000) });
});
app.post('/api/orders/:orderNumber/cancel', customer, async (req, res) => {
  const session = await Order.startSession(); let result;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ orderNumber: req.params.orderNumber, sessionHash: req.sessionHash }).session(session);
      if (!order) throw fail(404, 'ORDER_NOT_FOUND', 'This confirmation is not available in this browser session.');
      if (order.status === 'Cancelled') { result = order; return; }
      if (!['New', 'Ready'].includes(order.status) || Date.now() > order.pickupAt.getTime() - 6 * 60 * 60 * 1000) throw fail(409, 'CANCELLATION_CLOSED', 'This order can no longer be cancelled.');
      const changed = await Order.updateOne({ _id: order._id, status: { $in: ['New', 'Ready'] }, pickupAt: { $gte: new Date(Date.now() + 6 * 60 * 60 * 1000) } }, { $set: { status: 'Cancelled', cancelledAt: new Date() } }, { session });
      if (changed.modifiedCount !== 1) throw fail(409, 'CANCELLATION_CLOSED', 'This order can no longer be cancelled.');
      for (const item of order.items) await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session });
      result = await Order.findById(order._id).session(session);
    });
  } finally { await session.endSession(); }
  res.json({ order: result, stockRestored: result.status === 'Cancelled' });
});
app.get('/api/owner/products', async (req, res) => res.json({ products: await Product.find().sort({ active: -1, category: 1, name: 1 }).lean() }));
function productInput(body, partial = false) {
  const value = {};
  for (const field of ['name', 'description', 'category', 'price', 'stock', 'imageUrl']) if (body?.[field] !== undefined) value[field] = body[field];
  if ((!partial && (!value.name || typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 160)) || (value.name !== undefined && (typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 160))) throw fail(400, 'INVALID_PRODUCT', 'Enter a product name up to 160 characters.');
  if ((!partial && (typeof value.description !== 'string' || !value.description.trim() || value.description.length > 2000)) || (value.description !== undefined && (typeof value.description !== 'string' || !value.description.trim() || value.description.length > 2000))) throw fail(400, 'INVALID_PRODUCT', 'Enter a description up to 2,000 characters.');
  if ((!partial && !categories.includes(value.category)) || (value.category !== undefined && !categories.includes(value.category))) throw fail(400, 'INVALID_CATEGORY', 'Choose one of the available categories.');
  if ((!partial && (!Number.isSafeInteger(value.price) || value.price < 1)) || (value.price !== undefined && (!Number.isSafeInteger(value.price) || value.price < 1))) throw fail(400, 'INVALID_PRICE', 'Price must be a positive whole number in minor units.');
  if ((!partial && (!Number.isSafeInteger(value.stock) || value.stock < 0)) || (value.stock !== undefined && (!Number.isSafeInteger(value.stock) || value.stock < 0))) throw fail(400, 'INVALID_STOCK', 'Stock must be a nonnegative whole number.');
  if (value.imageUrl !== undefined && (typeof value.imageUrl !== 'string' || (value.imageUrl && (!value.imageUrl.startsWith('https://') || value.imageUrl.length > 2048)))) throw fail(400, 'INVALID_IMAGE', 'Use an HTTPS image URL.');
  if (value.name) value.name = value.name.trim();
  return value;
}
app.post('/api/owner/products', async (req, res) => res.status(201).json({ product: await Product.create({ ...productInput(req.body), sample: false }) }));
app.get('/api/owner/products/:productId', async (req, res) => { const product = await Product.findById(req.params.productId).lean(); if (!product) throw fail(404, 'PRODUCT_NOT_FOUND', 'Product not found.'); res.json({ product }); });
app.patch('/api/owner/products/:productId', async (req, res) => { if (req.body?.stock !== undefined) throw fail(400, 'INVALID_STOCK', 'Use the restock action to add stock.'); const product = await Product.findByIdAndUpdate(req.params.productId, { $set: productInput(req.body, true) }, { returnDocument: 'after', runValidators: true }); if (!product) throw fail(404, 'PRODUCT_NOT_FOUND', 'Product not found.'); res.json({ product }); });
app.post('/api/owner/products/:productId/archive', async (req, res) => { const product = await Product.findByIdAndUpdate(req.params.productId, { $set: { active: false } }, { returnDocument: 'after' }); if (!product) throw fail(404, 'PRODUCT_NOT_FOUND', 'Product not found.'); res.json({ product }); });
app.post('/api/owner/products/:productId/restock', async (req, res) => { const quantity = req.body?.quantity; if (!Number.isSafeInteger(quantity) || quantity < 1) throw fail(400, 'INVALID_QUANTITY', 'Restock quantity must be a positive whole number.'); const product = await Product.findOneAndUpdate({ _id: req.params.productId, stock: { $lte: Number.MAX_SAFE_INTEGER - quantity } }, { $inc: { stock: quantity } }, { returnDocument: 'after' }); if (!product) { if (await Product.exists({ _id: req.params.productId })) throw fail(400, 'INVALID_STOCK', 'The resulting stock exceeds the supported limit.'); throw fail(404, 'PRODUCT_NOT_FOUND', 'Product not found.'); } res.json({ product }); });
app.get('/api/owner/orders', async (req, res) => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const archived = req.query.view === 'archived';
  if (req.query.view && !['recent', 'archived'].includes(req.query.view)) throw fail(400, 'INVALID_VIEW', 'Choose the recent or archived order view.');
  const orders = await Order.find(archived ? { createdAt: { $lt: cutoff } } : { createdAt: { $gte: cutoff } }).sort({ pickupAt: 1 }).lean();
  res.json({ orders, timezone: timezone(), view: archived ? 'archived' : 'recent' });
});
app.get('/api/owner/orders/:orderId', async (req, res) => { const order = await Order.findById(req.params.orderId).lean(); if (!order) throw fail(404, 'ORDER_NOT_FOUND', 'Order not found.'); res.json({ order, timezone: timezone() }); });
app.patch('/api/owner/orders/:orderId/status', async (req, res) => {
  const next = req.body?.status;
  if (!['Ready', 'Picked up'].includes(next)) throw fail(400, 'INVALID_STATUS', 'Choose the next available order status.');
  const from = next === 'Ready' ? 'New' : 'Ready';
  const order = await Order.findOneAndUpdate({ _id: req.params.orderId, status: from }, { $set: { status: next } }, { returnDocument: 'after' });
  if (!order) { if (await Order.exists({ _id: req.params.orderId })) throw fail(409, 'ORDER_STATUS_CONFLICT', 'This order cannot move to that status.'); throw fail(404, 'ORDER_NOT_FOUND', 'Order not found.'); }
  res.json({ order });
});
app.use('/api', (req, res, next) => next(fail(404, 'NOT_FOUND', 'This API endpoint does not exist.')));
app.use((error, req, res, next) => {
  const status = error.status || (error.name === 'ValidationError' ? 400 : error.name === 'CastError' ? 404 : 500);
  res.status(status).json({ error: { code: error.code && typeof error.code === 'string' ? error.code : status === 400 ? 'INVALID_INPUT' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR', message: status === 404 ? 'The requested record was not found.' : status < 500 ? error.message : 'The service could not complete your request.' } });
});
export default app;
