import mongoose from 'mongoose';
import { connectDb } from '../server/db.js';
try { await connectDb(); await mongoose.connection.db.admin().ping(); console.log('MongoDB connection verified.'); }
catch { console.error('MongoDB unavailable. Set MONGODB_URI in .env and check Atlas network access.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
