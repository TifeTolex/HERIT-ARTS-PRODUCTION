// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../data/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'devsupersecret';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'No token provided. Please log in.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ error: 'User not found. Please log in.' });

    req.user = user; // attach user to request

    // Only block routes that require active subscription
    // e.g., /api/projects POST
    if (req.path.startsWith('/projects') && req.method === 'POST') {
      const now = new Date();
      const hasActiveSub = user.brand?.subscription?.status === 'active';
      const withinTrial = user.trialEndsAt && now <= new Date(user.trialEndsAt);

      if (!hasActiveSub && !withinTrial) {
        return res.status(402).json({ error: 'Trial expired. Please subscribe to continue.' });
      }
    }

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
}
