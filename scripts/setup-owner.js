import mongoose from 'mongoose';
import { connectDb } from '../server/db.js';
import { Owner } from '../server/models.js';
import { credentials, hashPassword } from '../server/security.js';
try {
  const { email, password } = credentials({ email: process.env.OWNER_EMAIL, password: process.env.OWNER_PASSWORD });
  if (password.length < 12) throw new Error('Use an owner password of at least 12 characters.');
  await connectDb(); await Owner.init();
  if (await Owner.exists({})) throw new Error('An owner already exists. Setup does not overwrite credentials.');
  await Owner.create({ email, passwordHash: await hashPassword(password) });
  console.log('Owner created. Remove OWNER_PASSWORD from .env after setup.');
} catch (error) { console.error(error.code === 11000 ? 'An owner already exists.' : error.message.includes('password') || error.message.includes('owner') || error.status ? error.message : 'Owner setup failed. Check the database configuration.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
