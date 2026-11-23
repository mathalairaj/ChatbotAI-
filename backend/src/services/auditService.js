import { getDb } from '../db/index.js';
import { getClientIp } from '../middleware/security.js';

export async function recordAudit({ req, action, resourceType, resourceId = null, details = {}, userOverride = null }) {
  try {
    const db = getDb();
    const actor = userOverride || req?.user || null;
    await db.createAuditLog({
      user_id: actor?.id || null,
      user_email: actor?.email || null,
      user_role: actor?.role || 'guest',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: req ? getClientIp(req) : 'system',
      details,
    });
  } catch (err) {
    console.error('[AuditLog Warning]', err.message);
  }
}
