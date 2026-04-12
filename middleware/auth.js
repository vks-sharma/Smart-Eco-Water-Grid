'use strict';
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable must be set in production.');
    process.exit(1);
  }
  // In development, generate a random ephemeral secret so no fixed weak default
  // is ever present in the codebase. Tokens will be invalidated on each restart.
  console.warn('WARNING: JWT_SECRET not set. Using an ephemeral random secret (dev only). Set JWT_SECRET env var for persistent tokens.');
}

const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');

/**
 * Middleware: require a valid JWT. Returns 401 if missing/invalid.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Middleware: attach user if JWT present, otherwise req.user = null.
 */
function optionalAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch { req.user = null; }
  } else {
    req.user = null;
  }
  next();
}

module.exports = { requireAuth, optionalAuth, JWT_SECRET };
