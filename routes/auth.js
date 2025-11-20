// routes/auth.js
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email.js';
import User from '../data/models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsupersecret';

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ================== BRAND SIGNUP ==================
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, businessName, industry, brandColor, typography } = req.body;
    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ success: false, error: 'Missing required fields' });

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail }))
      return res.status(400).json({ success: false, error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
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
      // trialEndsAt auto-set in schema
    });

    await user.save();
    sendWelcomeEmail(user.email, user.firstName).catch(console.error);

    res.json({
      success: true,
      token: generateToken(user),
      user: { id: user._id, email: user.email, role: user.role, trialEndsAt: user.trialEndsAt }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Signup failed' });
  }
});

// ================== STAFF SIGNUP ==================
router.post('/staff-signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ success: false, error: 'Missing required fields' });

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail }))
      return res.status(400).json({ success: false, error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'staff'
    });

    await user.save();
    sendWelcomeEmail(user.email, user.firstName).catch(console.error);

    res.json({
      success: true,
      token: generateToken(user),
      user: { id: user._id, email: user.email, role: user.role, trialEndsAt: user.trialEndsAt }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Staff signup failed' });
  }
});

// ================== LOGIN ==================
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Missing email or password' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid email or password' });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ success: false, error: 'Invalid email or password' });

    if (role && user.role.toLowerCase() !== role.toLowerCase())
      return res.status(403).json({ success: false, error: `Role mismatch: account is '${user.role}'` });

    res.json({
      success: true,
      token: generateToken(user),
      user: { id: user._id, email: user.email, role: user.role, trialEndsAt: user.trialEndsAt }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ================== REQUEST PASSWORD RESET ==================
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const resetToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
      sendPasswordResetEmail(user.email, resetToken).catch(console.error);
    }

    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to request password reset' });
  }
});

// ================== RESET PASSWORD ==================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ success: false, error: 'Missing token or new password' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, email: decoded.email });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid token or user not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch {
    res.status(400).json({ success: false, error: 'Invalid or expired token' });
  }
});

export default router;
