import express from 'express';
import { users, saveDb } from '../data/store.js';

const router = express.Router();

// ================= BRAND ROUTES =================

// Get my brand
router.get('/me', (req, res) => {
  const me = users.find(u => u.id === req.headers.authorization?.replace('Bearer ', ''));
  if (!me || !me.brand) return res.status(404).json({ error: 'No brand' });
  res.json({ brand: me.brand });
});

// Onboard / update brand
router.post('/onboard', (req, res) => {
  const me = users.find(u => u.id === req.headers.authorization?.replace('Bearer ', ''));
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  me.brand = { ...me.brand, ...req.body };
  saveDb();
  res.json({ brand: me.brand });
});

// Subscriptions
router.post('/subscriptions', (req, res) => {
  const me = users.find(u => u.id === req.headers.authorization?.replace('Bearer ', ''));
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  me.brand.subscription = {
    plan: req.body.plan,
    status: 'active',
    gateway: req.body.gateway,
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
  saveDb();
  res.json({ subscription: me.brand.subscription });
});

router.post('/subscriptions/skip', (req, res) => {
  const me = users.find(u => u.id === req.headers.authorization?.replace('Bearer ', ''));
  if (!me) return res.status(401).json({ error: 'Unauthorized' });
  me.brand.subscription = { plan: null, status: 'skipped', renewsAt: null, gateway: null };
  saveDb();
  res.json({ subscription: me.brand.subscription });
});

// ================= STAFF ROUTES =================

// Staff: all brands
router.get('/admin', (req, res) => {
  const brands = users.filter(u => u.brand).map(u => ({
    id: u.brand.id,
    name: u.brand.businessName,
    industry: u.brand.industry,
    subscription: u.brand.subscription,
    activeProjects: (u.brand.projects || []).filter(p => p.status !== 'Completed').length,
    ownerEmail: u.email
  }));
  res.json({ brands });
});

// Staff: alias for all brands (/admin/all to match staff.js)
router.get('/admin/all', (req, res) => {
  const brands = users.filter(u => u.brand).map(u => ({
    id: u.brand.id,
    name: u.brand.businessName,
    industry: u.brand.industry,
    subscription: u.brand.subscription,
    activeProjects: (u.brand.projects || []).filter(p => p.status !== 'Completed').length,
    ownerEmail: u.email
  }));
  res.json({ brands });
});

// Staff: single brand (consistent with staff.js call)
router.get('/admin/:id', (req, res) => {
  const brand = users.map(u => u.brand).find(b => b && b.id === req.params.id);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });
  res.json(brand);
});

export default router;
