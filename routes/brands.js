// routes/brands.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../data/models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsupersecret';

// ----------------- Helper: Get current user from JWT -----------------
async function getCurrentUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    return user;
  } catch {
    return null;
  }
}

// ================= BRAND ROUTES =================

// Get my brand
router.get('/me', async (req, res) => {
  const me = await getCurrentUser(req);
  if (!me || !me.brand) return res.status(404).json({ error: 'No brand found' });
  res.json({ brand: me.brand });
});

// Onboard / update brand
router.post('/onboard', async (req, res) => {
  const me = await getCurrentUser(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  me.brand = { ...me.brand, ...req.body };
  await me.save();

  res.json({ brand: me.brand });
});

// Subscriptions: set active plan
router.post('/subscriptions', async (req, res) => {
  const me = await getCurrentUser(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  me.brand.subscription = {
    plan: req.body.plan,
    status: 'active',
    gateway: req.body.gateway,
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
  await me.save();

  res.json({ subscription: me.brand.subscription });
});

// Subscriptions: skip plan
router.post('/subscriptions/skip', async (req, res) => {
  const me = await getCurrentUser(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  me.brand.subscription = { plan: null, status: 'skipped', renewsAt: null, gateway: null };
  await me.save();

  res.json({ subscription: me.brand.subscription });
});

// ================= STAFF ROUTES =================

// Staff: all brands
router.get('/admin', async (req, res) => {
  const users = await User.find({ brand: { $exists: true } }).lean();

  const brands = users.map(u => ({
    id: u.brand.id,
    name: u.brand.businessName,
    industry: u.brand.industry,
    subscription: u.brand.subscription,
    activeProjects: (u.brand.projects || []).filter(p => p.status !== 'Completed').length,
    ownerEmail: u.email
  }));

  res.json({ brands });
});

// Staff: alias for all brands (/admin/all)
router.get('/admin/all', async (req, res) => {
  const users = await User.find({ brand: { $exists: true } }).lean();

  const brands = users.map(u => ({
    id: u.brand.id,
    name: u.brand.businessName,
    industry: u.brand.industry,
    subscription: u.brand.subscription,
    activeProjects: (u.brand.projects || []).filter(p => p.status !== 'Completed').length,
    ownerEmail: u.email
  }));

  res.json({ brands });
});

// Staff: single brand by brand ID
router.get('/admin/:id', async (req, res) => {
  const user = await User.findOne({ 'brand.id': req.params.id }).lean();
  if (!user) return res.status(404).json({ error: 'Brand not found' });

  res.json(user.brand);
});

export default router;
