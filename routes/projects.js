// routes/projects.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import User from '../data/models/User.js';
import Project from "../data/models/project.js";


const router = express.Router();

// Multer setup (unchanged)
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

// Create project (brand creates -> new Project doc)
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.brand) return res.status(400).json({ error: 'Brand not found' });

    const payload = {
      externalId: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: req.body.name || req.body.projectName || 'Untitled Project',
      brief: req.body.brief || req.body.description || '',
      requirements: req.body.requirements || '',
      brand: user._id,
      brandName: user.brand.businessName || user.brand.name || '',
      brandEmail: user.email,
      status: 'Pending',
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      metadata: req.body.metadata || {}
    };

    const project = await Project.create(payload);

    // Optionally keep a reference in the User.brand.projects (compatibility)
    // push minimal reference
    if (!user.brand.projects) user.brand.projects = [];
    user.brand.projects.push({
      id: project.externalId,
      name: project.name,
      deadline: project.deadline,
      createdAt: project.createdAt
    });
    await user.save();

    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// List my projects (from Projects collection)
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ brand: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ externalId: req.params.id, brand: req.user._id }).lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Upload files to project (brand)
router.post('/:id/upload', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const project = await Project.findOne({ externalId: req.params.id, brand: req.user._id });
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
    res.json({ files: project.files, project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Approve / mark complete (brand)
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ externalId: req.params.id, brand: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.status = 'Completed';
    await project.save();
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

// Request changes (brand)
router.post('/:id/changes', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ externalId: req.params.id, brand: req.user._id });
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

// List all projects for staff/admin
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    // populate brand basic info
    const projects = await Project.find().sort({ createdAt: -1 }).populate('brand', 'email brand').lean();
    // normalize brandName/brandEmail
    const out = projects.map(p => ({
      ...p,
      brandEmail: p.brand?.email || p.brandEmail,
      brandName: (p.brand?.brand?.businessName || p.brandName) || (p.brand?.brand?.name || p.brandName)
    }));
    res.json({ projects: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all projects' });
  }
});

// Get single project by ID for staff/admin
router.get('/admin/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ externalId: req.params.id }).populate('brand', 'email brand').lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.brandEmail = project.brand?.email || project.brandEmail;
    project.brandName = project.brand?.brand?.businessName || project.brandName || project.brand?.brand?.name;
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
    const project = await Project.findOne({ externalId: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.assignee = email;
    project.status = 'In Progress';
    await project.save();

    // populate for response
    await project.populate('brand', 'email brand').execPopulate?.() || null;
    project.brandEmail = project.brand?.email || project.brandEmail;
    project.brandName = project.brand?.brand?.businessName || project.brandName || project.brand?.brand?.name;

    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign project' });
  }
});

// Deliver project with optional files (staff)
router.post('/admin/:id/deliver', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const project = await Project.findOne({ externalId: req.params.id }).populate('brand');
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
    project.deliveredAt = new Date();
    await project.save();

    // Notify brand: ensure owner has notifications array
    const owner = project.brand;
    if (owner) {
      owner.notifications = owner.notifications || [];
      owner.notifications.push({
        type: 'project_delivered',
        projectId: project.externalId,
        projectName: project.name,
        message: `Your project "${project.name}" has been delivered.`,
        createdAt: new Date(),
        read: false
      });
      await owner.save();
    }

    // response prepare
    const out = project.toObject();
    out.brandEmail = owner?.email || out.brandEmail;
    out.brandName = owner?.brand?.businessName || out.brandName || owner?.brand?.name;

    res.json({ project: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deliver project' });
  }
});

// Admin analytics summary
router.get('/admin-analytics/summary', requireAuth, async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const completed = await Project.countDocuments({ status: 'Completed' });
    const delivered = await Project.countDocuments({ status: 'Delivered' });

    // active brands (distinct brand ids)
    const activeBrandsAgg = await Project.aggregate([
      { $group: { _id: '$brand' } },
      { $count: 'activeBrands' }
    ]);
    const activeBrands = activeBrandsAgg[0]?.activeBrands || 0;

    // dummy revenue can be replaced by real pricing logic
    const revenue = totalProjects * 200;

    res.json({
      revenueFormatted: `$${revenue}`,
      projectsCompleted: completed,
      projectsDelivered: delivered,
      activeBrands,
      totalProjects
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
