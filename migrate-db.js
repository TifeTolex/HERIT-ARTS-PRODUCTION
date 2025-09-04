// migrate-db.js
import fs from 'fs';

const path = './data/db.json'; // adjust if your db.json is elsewhere
const raw = fs.readFileSync(path, 'utf-8');
const db = JSON.parse(raw);

function ensureBrandFields(brand) {
  brand.typography = brand.typography || '';
  brand.subscription = brand.subscription || {
    plan: null,
    status: 'none',
    gateway: null,
    renewsAt: null
  };
  brand.members = brand.members || [];
  if (!brand.members.length && brand.userId) {
    // fallback: add owner as admin if we can match user
    const owner = db.users.find(u => u.id === brand.userId);
    if (owner) brand.members.push({ email: owner.email, role: 'Admin' });
  }
  brand.projects = brand.projects || [];
  brand.history = brand.history || [];
  return brand;
}

function ensureProjectFields(project) {
  project.primaryGoal = project.primaryGoal || '';
  project.keyFeatures = project.keyFeatures || '';
  project.targetAudience = project.targetAudience || [];
  project.toneOfVoice = project.toneOfVoice || [];
  project.usage = project.usage || [];
  project.notes = project.notes || '';
  project.assets = project.assets || {
    logo: '',
    colors: [],
    typography: '',
    products: []
  };
  project.assignee = project.assignee || null;
  project.files = project.files || [];
  project.status = project.status || 'Pending';
  return project;
}

// Upgrade brands
if (Array.isArray(db.brands)) {
  db.brands = db.brands.map(b => {
    b = ensureBrandFields(b);
    b.projects = (b.projects || []).map(ensureProjectFields);
    return b;
  });
}

// Upgrade projects (top-level, if you use them separately)
if (Array.isArray(db.projects)) {
  db.projects = db.projects.map(ensureProjectFields);
}

// Save upgraded db
fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log('✅ db.json upgraded successfully!');
