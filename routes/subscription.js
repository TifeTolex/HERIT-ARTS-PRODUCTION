// routes/subscription.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Return subscription info for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const subscription = user.brand?.subscription || null;
  const trialEndsAt = user.trialEndsAt || null;

  res.json({ subscription, trialEndsAt });
});

export default router;
