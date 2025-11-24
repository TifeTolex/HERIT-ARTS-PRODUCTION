// routes/projects.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import User from '../data/models/User.js';
import Project from "../data/models/project.js";

const router = express.Router();

// Multer setup
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

// ------------------------------------------------------
// UNIVERSAL PROJECT RESOLVER (MAIN FIX)
// ------------------------------------------------------
async function resolveProject(id, brandId = null) {
  const query = {
    $or: [{ externalId: id }, { _id: id }]
  };
  if (brandId) query.brand = brandId;
  return await Project.findOne(query);
}

// ------------------------------------------------------
// BRAND ROUTES
// ------------------------------------------------------

// Create a project
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.brand) return res.status(400).json({ error: 'Brand not found' });

  const payload = {
  externalId: Date.now().toString(36) + Math.random().toString(36).slice(2),
  name: req.body.title || req.body.name || 'Untitled Project', // map title -> name
  brief: req.body.brief || req.body.notes || '',              // map notes -> brief
  requirements: req.body.features || req.body.requirements || '',
  brand: user._id,
  brandName: user.brand.businessName || user.brand.name || '',
  brandEmail: user.email,
  status: 'Pending',
  deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
  metadata: {
    contentType: req.body.contentType,
    goal: req.body.goal,
    audience: req.body.audience,
    tones: req.body.tones,
    usage: req.body.usage,
    assets: req.body.assets
  }
};


    const project = await Project.create(payload);

    if (!user.brand.projects) user.brand.projects = [];
    user.brand.projects.push({
      id: project.externalId,
      name: project.name,
      deadline: project.deadline,
      createdAt: project.createdAt
    });
    await user.save();

    res.json({
      project: { ...project.toObject(), id: project._id.toString() }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// List brand projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ brand: req.user._id }).sort({ createdAt: -1 }).lean();

    const formatted = projects.map(p => ({
      ...p,
      id: p._id.toString()
    }));

    res.json({ projects: formatted });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project (BRAND)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await resolveProject(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    res.json({
      project: { ...project.toObject(), id: project._id.toString() }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Upload files (BRAND)
router.post('/:id/upload', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const project = await resolveProject(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!req.files?.length) {
      return res.json({ files: project.files });
    }

    const newFiles = req.files.map(f => ({
      url: `/uploads/${f.filename}`,
      originalName: f.originalname,
      uploadedBy: 'brand',
      uploadedAt: new Date()
    }));

    project.files.push(...newFiles);
    await project.save();

    res.json({
      files: project.files,
      project: { ...project.toObject(), id: project._id.toString() }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Approve project
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const project = await resolveProject(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.status = 'Completed';
    await project.save();

    res.json({
      project: { ...project.toObject(), id: project._id.toString() }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

// Brand requests changes
router.post('/:id/changes', requireAuth, async (req, res) => {
  try {
    const project = await resolveProject(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.status = 'In Progress';
    await project.save();

    res.json({
      project: { ...project.toObject(), id: project._id.toString() }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ------------------------------------------------------
// ADMIN / STAFF ROUTES
// ------------------------------------------------------

// List all projects
router.get('/admin/all', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .populate('brand', 'email brand')
      .lean();

    const formatted = projects.map(p => ({
      ...p,
      id: p._id.toString(),
      brandEmail: p.brand?.email || p.brandEmail,
      brandName: p.brand?.brand?.businessName || p.brand?.brand?.name || p.brandName
    }));

    res.json({ projects: formatted });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all projects' });
  }
});

// Admin/staff get single project
router.get('/admin/:id', requireAuth, async (req, res) => {
  try {
    const project = await resolveProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await project.populate('brand', 'email brand');

    const out = {
      ...project.toObject(),
      id: project._id.toString(),
      brandEmail: project.brand?.email,
      brandName: project.brand?.brand?.businessName || project.brand?.brand?.name
    };

    res.json({ project: out });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Assign project to staff
router.post('/admin/:id/assign', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const project = await resolveProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.assignee = email;
    project.status = 'In Progress';
    await project.save();

    await project.populate('brand', 'email brand');

    const out = {
      ...project.toObject(),
      id: project._id.toString(),
      brandEmail: project.brand?.email,
      brandName: project.brand?.brand?.businessName || project.brand?.brand?.name
    };

    res.json({ project: out });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign project' });
  }
});

// Staff deliver project
router.post('/admin/:id/deliver', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const project = await resolveProject(req.params.id);
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

    const owner = await User.findById(project.brand);
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

    res.json({
      project: {
        ...project.toObject(),
        id: project._id.toString(),
        brandEmail: owner?.email,
        brandName: owner?.brand?.businessName || owner?.brand?.name
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deliver project' });
  }
});

// Analytics
router.get('/admin-analytics/summary', requireAuth, async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const completed = await Project.countDocuments({ status: 'Completed' });
    const delivered = await Project.countDocuments({ status: 'Delivered' });

    const activeBrandsAgg = await Project.aggregate([
      { $group: { _id: '$brand' } },
      { $count: 'activeBrands' }
    ]);
    const activeBrands = activeBrandsAgg[0]?.activeBrands || 0;

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
