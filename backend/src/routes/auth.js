import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.js';
import { requireAuth, sanitizeUserOutput, signToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { isValidEmail } from '../middleware/security.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

/**
 * POST /api/auth/login
 * Supports Admin, Faculty, and Student login.
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!isValidEmail(email) || password.length < 6) {
      return res.status(400).json({ error: 'Please provide a valid email and password.' });
    }

    const db = getDb();
    const user = await db.findUserByEmail(email);
    if (!user || !user.is_active) {
      await recordAudit({
        req,
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'user',
        details: { email, reason: 'invalid_or_inactive' },
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await recordAudit({
        req,
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'user',
        resourceId: user.id,
        details: { email, reason: 'wrong_password' },
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await db.updateUserLogin(user.id);
    const token = signToken(user);
    const safeUser = sanitizeUserOutput(user);

    await recordAudit({
      req,
      action: 'AUTH_LOGIN_SUCCESS',
      resourceType: 'user',
      resourceId: user.id,
      userOverride: safeUser,
      details: { role: safeUser.role },
    });

    return res.json({ token, user: safeUser });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/auth/register
 * Public registration creates a `student` or `guest` account (Admin/Faculty accounts must be created by Admin).
 */
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const fullName = (req.body?.full_name || '').trim();
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const accountType = req.body?.role === 'guest' ? 'guest' : 'student';
    const registerNumber = (req.body?.register_number || '').trim() || null;
    const academicYear = (req.body?.academic_year || '').trim() || null;
    const departmentCode = (req.body?.department_code || '').trim().toUpperCase() || null;

    if (fullName.length < 2 || fullName.length > 140) {
      return res.status(400).json({ error: 'Full name must be between 2 and 140 characters.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const db = getDb();
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const role = await db.getRoleByName(accountType);
    let departmentId = null;
    if (departmentCode) {
      const dept = await db.getDepartmentByCode(departmentCode);
      if (dept) departmentId = dept.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await db.createUser({
      role_id: role.id,
      department_id: departmentId,
      full_name: fullName,
      email,
      password_hash: passwordHash,
      register_number: registerNumber,
      academic_year: academicYear,
      is_active: true,
    });

    const token = signToken(created);
    const safeUser = sanitizeUserOutput(created);

    await recordAudit({
      req,
      action: 'AUTH_REGISTER',
      resourceType: 'user',
      resourceId: safeUser.id,
      userOverride: safeUser,
      details: { role: safeUser.role },
    });

    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    if (String(err?.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email or register number is already registered.' });
    }
    return next(err);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req, res) => {
  await recordAudit({
    req,
    action: 'AUTH_LOGOUT',
    resourceType: 'user',
    resourceId: req.user.id,
  });
  return res.json({ ok: true });
});

export default router;
