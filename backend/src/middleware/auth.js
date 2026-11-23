import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getDb } from '../db/index.js';

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function sanitizeUserOutput(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password_hash;
  return copy;
}

/**
 * Role-based document visibility matrix enforced at the vector retrieval layer.
 */
export function getAllowedDocumentAccessLevels(role) {
  switch (role) {
    case 'admin':
      return ['public', 'student', 'faculty', 'admin'];
    case 'faculty':
      return ['public', 'student', 'faculty'];
    case 'student':
      return ['public', 'student'];
    default:
      return ['public'];
  }
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7).trim();
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const db = getDb();
    const user = await db.findUserById(decoded.sub);
    if (user && user.is_active) {
      req.user = sanitizeUserOutput(user);
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  return next();
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const token = header.slice(7).trim();
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const db = getDb();
    const user = await db.findUserById(decoded.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account inactive or not found.' });
    }
    req.user = sanitizeUserOutput(user);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
    }
    return next();
  };
}
