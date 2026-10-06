import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { connectDb } from './db.js';
import { Owner, Session, LoginAttempt } from './models.js';
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
app.use('/api', (req, res, next) => next(fail(404, 'NOT_FOUND', 'This API endpoint does not exist.')));
app.use((error, req, res, next) => {
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({ error: { code: error.code && typeof error.code === 'string' ? error.code : status === 400 ? 'INVALID_INPUT' : 'INTERNAL_ERROR', message: status < 500 ? error.message : 'The service could not complete your request.' } });
});
export default app;
