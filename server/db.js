import mongoose from 'mongoose';
let connecting;
export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!process.env.MONGODB_URI) {
    const error = new Error('Database is not configured.');
    error.status = 503; error.code = 'DATABASE_UNAVAILABLE'; throw error;
  }
  connecting ??= mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || 'bakery', serverSelectionTimeoutMS: 5000,
  }).catch(() => {
    throw Object.assign(new Error('Database unavailable.'), { status: 503, code: 'DATABASE_UNAVAILABLE' });
  }).finally(() => { connecting = undefined; });
  await connecting;
  return mongoose.connection;
}
