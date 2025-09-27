// data/models/User.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const BrandSchema = new mongoose.Schema({
  id: { type: String, default: () => crypto.randomUUID() },
  businessName: String,
  industry: String,
  brandColor: String,
  typography: String,
  members: [{ email: String, role: String }],
  subscription: {
    plan: { type: String, default: null },
    status: { type: String, default: 'none' },
    renewsAt: { type: Date, default: null },
    gateway: { type: String, default: null },
  },
  projects: { type: Array, default: [] },
  history: { type: Array, default: [] },
});

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['brand', 'staff'], default: 'brand' },
  brand: { type: BrandSchema, default: null },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;
