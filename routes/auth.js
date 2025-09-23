import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getUsers, addUser, saveDb } from '../data/store.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsupersecret';

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ================== BRAND SIGNUP ==================
router.post('/signup', (req, res) => {
  const { firstName, lastName, email, password, businessName, industry, brandColor, typography } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (getUsers().some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    role: 'brand',
    brand: {
      id: crypto.randomUUID(),
      businessName,
      industry,
      brandColor,
      typography,
      members: [{ email: normalizedEmail, role: 'Admin' }],
      subscription: { plan: null, status: 'none', renewsAt: null, gateway: null },
      projects: [],
      history: []
    }
  };

  addUser(user); // ✅ auto-saves

  const token = generateToken(user);
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

// ================== STAFF SIGNUP ==================
router.post('/staff-signup', (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (getUsers().some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    role: 'staff'
  };

  addUser(user); // ✅ auto-saves

  const token = generateToken(user);
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

// ================== LOGIN ==================
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  if (!user.role) {
    user.role = 'brand';
    saveDb(); // ✅ persist role assignment
  }

  if (role && user.role !== role) {
    return res.status(403).json({ error: `Role mismatch: account is '${user.role}', not '${role}'` });
  }

  const token = generateToken(user);
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;
