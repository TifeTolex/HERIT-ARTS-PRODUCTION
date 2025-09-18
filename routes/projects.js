import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getUsers, saveDb } from '../data/store.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ================== Multer setup ==================
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

// ================== Brand Routes ==================

// Create project
router.post('/', requireAuth, (req, res) => {
  const me = getUsers().find(u => u.id === req.user.id);
  if (!me?.brand) return res.status(401).json({ error: 'Unauthorized' });

  const proj = {
    id: crypto.randomUUID(),
    ...req.body,
    status: 'Pending',
    files: [],
    createdAt: new Date()
  };
  me.brand.projects.push(proj);
  saveDb();
  res.json({ project: proj });
});

// List my projects
router.get('/', requireAuth, (req, res) => {
  const me = getUsers().find(u => u.id === req.user.id);
  res.json({ projects: me?.brand?.projects || [] });
});

// Get single project
router.get('/:id', requireAuth, (req, res) => {
  const me = getUsers().find(u => u.id === req.user.id);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  res.json({ project: proj });
});

// Upload files (brand)
router.post('/:id/upload', requireAuth, upload.array('files'), (req, res) => {
  const me = getUsers().find(u => u.id === req.user.id);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });

  const newFiles = req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    originalName: f.originalname,
    uploadedBy: 'brand',
    uploadedAt: new Date()
  }));

  proj.files.push(...newFiles);
  saveDb();
  res.json({ files: proj.files });
});

// Approve / Changes
router.post('/:id/approve', requireAuth, (req, res) => {
  const me = getUsers().find(u => u.id === req.user.id);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  proj.status = 'Completed';
  saveDb();
  res.json({ project: proj });
});

router.post('/:id/changes', requireAuth, (req, res) => {
  const me = getUsers().find(u => u.id === req.user.id);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  proj.status = 'In Progress';
  saveDb();
  res.json({ project: proj });
});

// ================== Staff/Admin Routes ==================

// List all projects
router.get('/admin/all', requireAuth, (req, res) => {
  const projects = getUsers().flatMap(u => u.brand?.projects || []);
  res.json({ projects });
});

// Get single project by ID
router.get('/admin/:id', requireAuth, (req, res) => {
  const projects = getUsers().flatMap(u => u.brand?.projects || []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  res.json({ project: proj });
});

// Assign project to staff
router.post('/admin/:id/assign', requireAuth, (req, res) => {
  const projects = getUsers().flatMap(u => u.brand?.projects || []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });

  proj.assignee = req.body.email;
  proj.status = 'In Progress';
  saveDb();
  res.json({ project: proj });
});

// Deliver project with optional file upload
router.post('/admin/:id/deliver', requireAuth, upload.array('files'), (req, res) => {
  const projects = getUsers().flatMap(u => u.brand?.projects || []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });

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
  saveDb();
  res.json({ project: proj });
});

// Analytics summary
router.get('/admin-analytics/summary', requireAuth, (req, res) => {
  const projects = getUsers().flatMap(u => u.brand?.projects || []);
  const brands = getUsers().filter(u => u.brand).map(u => u.brand);
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
