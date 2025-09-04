import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { users, saveDb } from '../data/store.js';

const router = express.Router();
function findMe(req){ return users.find(u => u.id === req.headers.authorization?.replace('Bearer ', '')); }

// ================== Multer setup ==================
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ================== Brand Routes ==================

// Create project
router.post('/', (req, res) => {
  const me = findMe(req);
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
router.get('/', (req, res) => {
  const me = findMe(req);
  res.json({ projects: me?.brand?.projects || [] });
});

// Get single project (always include files)
router.get('/:id', (req, res) => {
  const me = findMe(req);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  res.json({ project: proj });
});

// Upload files (brand)
router.post('/:id/upload', upload.array('files'), (req, res) => {
  const me = findMe(req);
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
router.post('/:id/approve', (req, res) => {
  const me = findMe(req);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  proj.status = 'Completed';
  saveDb();
  res.json({ project: proj });
});
router.post('/:id/changes', (req, res) => {
  const me = findMe(req);
  const proj = me?.brand?.projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  proj.status = 'In Progress';
  saveDb();
  res.json({ project: proj });
});

// ================= Staff Routes =================

// All projects
router.get('/admin/all', (req, res) => {
  const projects = users.flatMap(u => u.brand?.projects || []);
  res.json({ projects });
});

// Single project
router.get('/admin/:id', (req, res) => {
  const projects = users.flatMap(u => u.brand?.projects || []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  res.json(proj);
});

// Assign
router.post('/admin/:id/assign', (req, res) => {
  const projects = users.flatMap(u => u.brand?.projects || []);
  const proj = projects.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  proj.assignee = req.body.email;
  proj.status = 'In Progress';
  saveDb();
  res.json({ project: proj });
});

// Deliver with optional file upload
router.post('/admin/:id/deliver', upload.array('files'), (req, res) => {
  const projects = users.flatMap(u => u.brand?.projects || []);
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

// Analytics
router.get('/admin-analytics/summary', (req, res) => {
  const projects = users.flatMap(u => u.brand?.projects || []);
  const brands = users.filter(u=>u.brand).map(u=>u.brand);
  const completed = projects.filter(p=>p.status==='Completed').length;
  const revenue = brands.reduce((sum,b)=> b.subscription?.plan ? sum+200 : sum, 0); // dummy
  res.json({
    revenueFormatted: `$${revenue}`,
    projectsCompleted: completed,
    activeBrands: brands.filter(b=>b.projects?.length).length,
    inactiveBrands: brands.filter(b=>!(b.projects?.length)).length,
    topBrands: brands.slice(0,5).map(b=>({ name:b.businessName, count:b.projects?.length||0 })),
    perMonth: [{ month:'Aug', count: projects.length }]
  });
});

export default router;
