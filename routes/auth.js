// routes/auth.js
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getUsers, addUser, saveDb } from '../data/store.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email.js';

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
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, businessName, industry, brandColor, typography } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (getUsers().some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: normalizedEmail,
    password: hashedPassword,
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

  addUser(user);

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user.email, user.firstName).catch(err => console.error('Email error:', err));

  const token = generateToken(user);
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

// ================== STAFF SIGNUP ==================
router.post('/staff-signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (getUsers().some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'staff'
  };

  addUser(user);

  sendWelcomeEmail(user.email, user.firstName).catch(err => console.error('Email error:', err));

  const token = generateToken(user);
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

// ================== LOGIN ==================
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  if (!user.role) {
    user.role = 'brand';
    saveDb();
  }

  if (role && user.role !== role) {
    return res.status(403).json({ error: `Role mismatch: account is '${user.role}', not '${role}'` });
  }

  const token = generateToken(user);
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

// ================== REQUEST PASSWORD RESET ==================
router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    // Don't reveal if user exists
    return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  }

  const resetToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });

  sendPasswordResetEmail(user.email, resetToken).catch(err => console.error('Failed to send reset email:', err));

  res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
});

// ================== RESET PASSWORD ==================
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) return res.status(400).json({ error: 'Missing token or new password' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = getUsers();
    const user = users.find(u => u.id === decoded.id && u.email === decoded.email);
    if (!user) return res.status(400).json({ error: 'Invalid token or user not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    saveDb();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
});

export default router;
