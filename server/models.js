import mongoose from 'mongoose';
const { Schema, model } = mongoose;
export const categories = ['Bread', 'Pastries', 'Cakes', 'Drinks'];
const integer = (min = 0) => ({ type: Number, required: true, min, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger });
const reference = { type: Schema.Types.ObjectId, required: true };
const item = new Schema({ productId: reference, quantity: integer(1) }, { _id: false });
const snapshot = new Schema({ productId: reference, name: { type: String, required: true }, unitPrice: integer(1), quantity: integer(1) }, { _id: false });
export const Product = model('Product', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, maxlength: 2000 },
  category: { type: String, enum: categories, required: true },
  price: integer(1), imageUrl: String, stock: integer(), active: { type: Boolean, default: true },
  sample: { type: Boolean, default: false },
}, { timestamps: true }));
export const Cart = model('Cart', new Schema({ sessionHash: { type: String, required: true, unique: true }, items: [item] }, { timestamps: true }));
export const Owner = model('Owner', new Schema({
  singleton: { type: String, default: 'owner', enum: ['owner'], unique: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true }));
export const Session = model('Session', new Schema({
  tokenHash: { type: String, required: true, unique: true },
  kind: { type: String, enum: ['owner', 'customer'], required: true },
  ownerId: Schema.Types.ObjectId,
  expiresAt: { type: Date, required() { return this.kind === 'owner'; }, index: { expireAfterSeconds: 0 } },
}, { timestamps: true }));
export const LoginAttempt = model('LoginAttempt', new Schema({
  key: { type: String, required: true, unique: true }, count: integer(1),
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}));
export const Order = model('Order', new Schema({
  orderNumber: { type: String, required: true, unique: true },
  sessionHash: { type: String, required: true },
  idempotencyKey: { type: String, required: true, unique: true },
  customerName: { type: String, required: true }, phone: { type: String, required: true },
  pickupAt: { type: Date, required: true },
  status: { type: String, enum: ['New', 'Ready', 'Picked up', 'Cancelled'], default: 'New' },
  items: { type: [snapshot], required: true, immutable: true },
  total: { ...integer(), immutable: true }, cancelledAt: Date, archivedAt: Date,
}, { timestamps: true }));
