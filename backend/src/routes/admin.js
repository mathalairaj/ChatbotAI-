import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.js';
import { requireAuth, requireRole, sanitizeUserOutput } from '../middleware/auth.js';
import { isValidEmail } from '../middleware/security.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// All routes in /api/admin require authenticated Admin role
router.use(requireAuth, requireRole('admin'));

/**
 * GET /api/admin/analytics
 * Module 9: Admin Dashboard KPIs, FAQs, Unanswered questions, daily trends, intent distribution
 */
router.get('/analytics', async (_req, res, next) => {
  try {
    const db = getDb();
    const analytics = await db.getAdminAnalytics();
    return res.json(analytics);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admin/roles
 */
router.get('/roles', async (_req, res, next) => {
  try {
    const db = getDb();
    const roles = await db.listRoles();
    return res.json({ roles });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admin/users
 */
router.get('/users', async (_req, res, next) => {
  try {
    const db = getDb();
    const users = await db.listUsers();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/admin/users
 * Admin creates an Admin, Faculty, Student, or Guest account.
 */
router.post('/users', async (req, res, next) => {
  try {
    const fullName = (req.body?.full_name || '').trim();
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const roleName = (req.body?.role || 'student').trim().toLowerCase();
    const departmentCode = (req.body?.department_code || '').trim().toUpperCase() || null;
    const registerNumber = (req.body?.register_number || '').trim() || null;
    const academicYear = (req.body?.academic_year || '').trim() || null;

    if (fullName.length < 2) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const db = getDb();
    const role = await db.getRoleByName(roleName);
    if (!role) return res.status(400).json({ error: 'Invalid role name.' });

    const existing = await db.findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already exists.' });

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

    await recordAudit({
      req,
      action: 'ADMIN_USER_CREATED',
      resourceType: 'user',
      resourceId: created.id,
      details: { email: created.email, role: created.role },
    });

    return res.status(201).json({ user: sanitizeUserOutput(created) });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/admin/users/:id
 * Admin updates a user's role or active status.
 */
router.patch('/users/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const target = await db.findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    const patch = {};
    if (req.body?.role) {
      const role = await db.getRoleByName(req.body.role);
      if (!role) return res.status(400).json({ error: 'Invalid role.' });
      patch.role_id = role.id;
    }
    if (req.body?.is_active !== undefined) {
      // Prevent admin from accidentally locking themselves out
      if (target.id === req.user.id && req.body.is_active === false) {
        return res.status(400).json({ error: 'You cannot deactivate your own active admin account.' });
      }
      patch.is_active = Boolean(req.body.is_active);
    }
    if (req.body?.full_name) {
      patch.full_name = String(req.body.full_name).trim();
    }

    const updated = await db.updateUser(target.id, patch);

    await recordAudit({
      req,
      action: 'ADMIN_USER_UPDATED',
      resourceType: 'user',
      resourceId: updated.id,
      details: patch,
    });

    return res.json({ user: sanitizeUserOutput(updated) });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admin/audit-logs
 */
router.get('/audit-logs', async (req, res, next) => {
  try {
    const db = getDb();
    const limit = Math.min(250, Number(req.query.limit) || 100);
    const logs = await db.listAuditLogs(limit);
    return res.json({ logs });
  } catch (err) {
    return next(err);
  }
});

export default router;
