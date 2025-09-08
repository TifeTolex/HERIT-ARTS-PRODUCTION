import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getUsers, addUser, saveDb } from '../data/store.js';

const router = express.Router();

// BRAND SIGNUP
router.post('/signup', (req, res) => {
  const { firstName, lastName, email, password, businessName, industry, brandColor, typography } = req.body;
  const normalizedEmail = email.toLowerCase();

  if (getUsers().find(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    role: 'brand',   // ✅ always brand
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

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'devsupersecret',
    { expiresIn: '1d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// STAFF SIGNUP
router.post('/staff-signup', (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  if (getUsers().find(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    role: 'staff'  // ✅ always staff
  };

  addUser(user);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'devsupersecret',
    { expiresIn: '1d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = getUsers().find(
    u => u.email.toLowerCase() === normalizedEmail && u.password === password
  );
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  if (role && user.role !== role) {
    return res.status(403).json({ error: `Role mismatch: account is '${user.role}', not '${role}'` });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'devsupersecret',
    { expiresIn: '1d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;
