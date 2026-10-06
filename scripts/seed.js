import mongoose from 'mongoose';
import { connectDb } from '../server/db.js';
import { Product, categories } from '../server/models.js';
try {
  await connectDb();
  if (await Product.exists({})) throw new Error('Sample seed requires an empty catalog.');
  await Product.insertMany(categories.map(category => ({ name: `Sample ${category} item`, description: 'Sample content for development. Product details and prices are unconfirmed.', category, price: 100, stock: 10, sample: true })));
  console.log('Four labeled sample products created. Prices are sample integer minor units, not confirmed currency.');
} catch { console.error('Seed failed. Check the database connection and ensure the catalog is empty.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
