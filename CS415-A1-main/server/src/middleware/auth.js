const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bof-dev-secret-2026';

function requireAuth(req, res, next) {
  const authHeader = String(req.headers.authorization || '');
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.auth = {
      userId: Number(decoded.userId),
      email: decoded.email,
      fullName: decoded.fullName,
      isAdmin: Boolean(decoded.isAdmin),
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
