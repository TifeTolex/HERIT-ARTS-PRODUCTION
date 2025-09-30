// routes/projects.js
import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import User from '../data/models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsupersecret';

// ---------------- Multer setup ----------------
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ---------------- Helpers ----------------
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

function hasActiveSubscription(user) {
  if (!user?.subscription) return false;
  const { plan, status, trialEndsAt } = user.subscription;

  if (plan && status === 'active') return true;

  if (status === 'trialing' && trialEndsAt) {
    return new Date(trialEndsAt) > new Date();
  }

  return false;
}

// ================= Brand Routes =================

// Create project
router.post('/', async (req, res) => {
  const me = await getCurrentUser(req);
  if (!me?.brand) return res.status(401).json({ error: 'Unauthorized' });

  // 🚫 subscription enforcement
  if (!hasActiveSubscription(me)) {
    return res.status(403).json({ error: 'Subscription required to create projects' });
  }

  const proj = {
    id: crypto.randomUUID(),
    ...req.body,
    status: 'Pending',
    files: [],
    createdAt: new Date()
  };

  me.brand.projects.push(proj);
  await me.save();

  res.json({ project: proj });
});

// List my projects
router.get('/', async (req, res) => {
  const me = await getCurrentUser(req);
  res.json({ projects: me?.brand?.projects || [] });
});

// Get single project
router.get('/:id', async (req, res) => {
  const me = await getCurrentUser(req);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  res.json({ project: proj });
});

// Upload files (brand)
router.post('/:id/upload', upload.array('files'), async (req, res) => {
  const me = await getCurrentUser(req);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });

  // 🚫 block uploads if no active sub
  if (!hasActiveSubscription(me)) {
    return res.status(403).json({ error: 'Subscription required to upload files' });
  }

  const newFiles = req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    originalName: f.originalname,
    uploadedBy: 'brand',
    uploadedAt: new Date()
  }));

  proj.files.push(...newFiles);
  await me.save();

  res.json({ files: proj.files });
});

// Approve / Changes
router.post('/:id/approve', async (req, res) => {
  const me = await getCurrentUser(req);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });

  proj.status = 'Completed';
  await me.save();
  res.json({ project: proj });
});

router.post('/:id/changes', async (req, res) => {
  const me = await getCurrentUser(req);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });

  proj.status = 'In Progress';
  await me.save();
  res.json({ project: proj });
});

// ================= Staff/Admin Routes =================

// List all projects
router.get('/admin/all', async (req, res) => {
  const users = await User.find({ 'brand.projects.0': { $exists: true } }).lean();
  const projects = users.flatMap(u => u.brand?.projects || []);
  res.json({ projects });
});

// Get single project by ID
router.get('/admin/:id', async (req, res) => {
  const users = await User.find({ 'brand.projects.0': { $exists: true } }).lean();
  const projects = users.flatMap(u => u.brand?.projects || []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  res.json({ project: proj });
});

// Assign project to staff
router.post('/admin/:id/assign', async (req, res) => {
  const users = await User.find({ 'brand.projects.0': { $exists: true } });
  for (const u of users) {
    const proj = u.brand.projects.find(p => p.id === req.params.id);
    if (proj) {
      proj.assignee = req.body.email;
      proj.status = 'In Progress';
      await u.save();
      return res.json({ project: proj });
    }
  }
  res.status(404).json({ error: 'Not found' });
});

// Deliver project with optional file upload
router.post('/admin/:id/deliver', upload.array('files'), async (req, res) => {
  const users = await User.find({ 'brand.projects.0': { $exists: true } });
  for (const u of users) {
    const proj = u.brand.projects.find(p => p.id === req.params.id);
    if (proj) {
      if (req.files?.length) {
        const newFiles = req.files.map(f => ({
          url: `/uploads/${f.filename}`,
          originalName: f.originalname,
          uploadedBy: 'staff',
          uploadedAt: new Date()
        }));
        proj.files.push(...newFiles);
      }
      proj.status = 'Delivered';
      await u.save();
      return res.json({ project: proj });
    }
  }
  res.status(404).json({ error: 'Not found' });
});

// Analytics summary
router.get('/admin-analytics/summary', async (req, res) => {
  const users = await User.find({ 'brand.projects.0': { $exists: true } }).lean();
  const projects = users.flatMap(u => u.brand?.projects || []);
  const brands = users.map(u => u.brand);

  const completed = projects.filter(p => p.status === 'Completed').length;
  const revenue = brands.reduce((sum, b) => b.subscription?.plan ? sum + 200 : sum, 0); // dummy

  res.json({
    revenueFormatted: `$${revenue}`,
    projectsCompleted: completed,
    activeBrands: brands.filter(b => b.projects?.length).length,
    inactiveBrands: brands.filter(b => !(b.projects?.length)).length,
    topBrands: brands.slice(0, 5).map(b => ({ name: b.businessName, count: b.projects?.length || 0 })),
    perMonth: [{ month: 'Aug', count: projects.length }]
  });
});

export default router;
