// routes/projects.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import User from '../data/models/User.js';

const router = express.Router();

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

// ---------------- Brand Routes ----------------

// Create project
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.brand) return res.status(400).json({ error: 'Brand not found' });

    const proj = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      ...req.body,
      status: 'Pending',
      files: [],
      createdAt: new Date()
    };

    user.brand.projects.push(proj);
    await user.save();

    res.json({ project: proj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// List my projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = req.user.brand?.projects || [];
    res.json({ projects: projects.sort((a, b) => b.createdAt - a.createdAt) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = req.user.brand?.projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Upload files to project
router.post('/:id/upload', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const project = req.user.brand?.projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!req.files?.length) return res.json({ files: project.files });

    const newFiles = req.files.map(f => ({
      url: `/uploads/${f.filename}`,
      originalName: f.originalname,
      uploadedBy: 'brand',
      uploadedAt: new Date()
    }));

    project.files.push(...newFiles);
    await req.user.save();
    res.json({ files: project.files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Approve / mark complete
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const project = req.user.brand?.projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.status = 'Completed';
    await req.user.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

// Request changes
router.post('/:id/changes', requireAuth, async (req, res) => {
  try {
    const project = req.user.brand?.projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.status = 'In Progress';
    await req.user.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ---------------- Admin / Staff Routes ----------------

// List all projects for staff/admin
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    const users = await User.find({ 'brand.projects.0': { $exists: true } });
    const projects = users.flatMap(u => 
      u.brand?.projects.map(p => ({
        ...p,
        brandEmail: u.email,
        brandName: u.brand.businessName || u.brand.name || 'Brand'
      })) || []
    );
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all projects' });
  }
});

// Get single project by ID for staff/admin
router.get('/admin/:id', requireAuth, async (req, res) => {
  try {
    const users = await User.find({ 'brand.projects.0': { $exists: true } });
    let project;
    for (const u of users) {
      project = u.brand.projects.find(p => p.id === req.params.id);
      if (project) {
        project.brandEmail = u.email;
        project.brandName = u.brand.businessName || u.brand.name || 'Brand';
        break;
      }
    }
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Assign project to staff
router.post('/admin/:id/assign', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const users = await User.find({ 'brand.projects.0': { $exists: true } });
    let project, owner;
    for (const u of users) {
      project = u.brand.projects.find(p => p.id === req.params.id);
      if (project) {
        owner = u;
        project.assignee = email;
        project.status = 'In Progress';
        await owner.save();
        project.brandEmail = u.email;
        project.brandName = u.brand.businessName || u.brand.name || 'Brand';
        break;
      }
    }
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign project' });
  }
});

// Deliver project with optional files
router.post('/admin/:id/deliver', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const users = await User.find({ 'brand.projects.0': { $exists: true } });
    let project, owner;
    for (const u of users) {
      project = u.brand.projects.find(p => p.id === req.params.id);
      if (project) {
        owner = u;
        break;
      }
    }
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.files?.length) {
      const newFiles = req.files.map(f => ({
        url: `/uploads/${f.filename}`,
        originalName: f.originalname,
        uploadedBy: 'staff',
        uploadedAt: new Date()
      }));
      project.files.push(...newFiles);
    }

    project.status = 'Delivered';
    await owner.save();

    project.brandEmail = owner.email;
    project.brandName = owner.brand.businessName || owner.brand.name || 'Brand';

    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deliver project' });
  }
});

// Admin analytics summary
router.get('/admin-analytics/summary', requireAuth, async (req, res) => {
  try {
    const users = await User.find({ 'brand.projects.0': { $exists: true } });
    const allProjects = users.flatMap(u => 
      u.brand.projects.map(p => ({
        ...p,
        brandEmail: u.email,
        brandName: u.brand.businessName || u.brand.name || 'Brand'
      })) || []
    );

    const completed = allProjects.filter(p => p.status === 'Completed').length;
    const revenue = allProjects.length * 200; // dummy value
    const activeBrands = new Set(allProjects.map(p => p.brandEmail)).size;

    res.json({
      revenueFormatted: `$${revenue}`,
      projectsCompleted: completed,
      activeBrands,
      totalProjects: allProjects.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});


export default router;
