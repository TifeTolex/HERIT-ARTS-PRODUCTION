// routes/projects.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import Project from '../data/models/Project.js';
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
    const data = req.body;

    const project = new Project({
      user: user._id,
      ...data,
      status: 'Pending',
      files: []
    });

    await project.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// List my projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
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
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!req.files?.length) return res.json({ files: project.files });

    const newFiles = req.files.map(f => ({
      url: `/uploads/${f.filename}`,
      originalName: f.originalname,
      uploadedBy: 'brand',
      uploadedAt: new Date()
    }));

    project.files.push(...newFiles);
    await project.save();
    res.json({ files: project.files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Approve / mark complete
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.status = 'Completed';
    await project.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

// Request changes
router.post('/:id/changes', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.status = 'In Progress';
    await project.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ---------------- Admin / Staff Routes ----------------

// List all projects
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find().populate('user', 'email').sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all projects' });
  }
});

// Get single project by ID
router.get('/admin/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('user', 'email');
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
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.assignee = req.body.email;
    project.status = 'In Progress';
    await project.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign project' });
  }
});

// Deliver project with optional files
router.post('/admin/:id/deliver', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
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
    await project.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deliver project' });
  }
});

// Admin analytics summary
router.get('/admin-analytics/summary', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find().populate('user', 'email');
    const completed = projects.filter(p => p.status === 'Completed').length;
    const revenue = projects.length * 200; // dummy value
    const activeBrands = new Set(projects.map(p => p.user.email)).size;

    res.json({
      revenueFormatted: `$${revenue}`,
      projectsCompleted: completed,
      activeBrands,
      totalProjects: projects.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
