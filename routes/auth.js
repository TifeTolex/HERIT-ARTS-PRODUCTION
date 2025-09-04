import express from 'express';
import crypto from 'crypto';
import { users, saveDb } from '../data/store.js';

const router = express.Router();

// SIGNUP
router.post('/signup', (req, res) => {
  const { firstName, lastName, email, password, businessName, industry, brandColor, typography, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  // Prevent duplicate users (case-insensitive)
  if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    role: role || 'brand',
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

  users.push(user);
  saveDb();
  res.json({ token: user.id });
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  if (role && user.role !== role) return res.status(403).json({ error: 'Role mismatch' });

  res.json({ token: user.id });
});

// RESET PASSWORD
router.post('/reset', (req, res) => {
  const { email, newPassword } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) return res.status(400).json({ error: 'No user' });

  user.password = newPassword;
  saveDb();
  res.json({ ok: true });
});

export default router;
