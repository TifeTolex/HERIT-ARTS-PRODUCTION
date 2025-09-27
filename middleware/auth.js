import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsupersecret');
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // ⏰ Session timeout case
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    // ❌ Anything else means token is invalid/corrupt
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
}
