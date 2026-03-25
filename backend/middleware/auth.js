import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export async function checkOrgAccess(req, res, next) {
  const orgId = req.params.orgId || req.user?.org_id;
  if (!orgId) return res.status(400).json({ error: 'Organization ID required' });
  if (req.user.org_id !== orgId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied to this organization' });
  }
  req.orgId = orgId;
  next();
}

export async function logActivity(orgId, userId, action, entityType, entityId, entityName, details, req) {
  try {
    await query(
      `INSERT INTO activity_log (org_id, user_id, action, entity_type, entity_id, entity_name, details, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [orgId, userId, action, entityType, entityId, entityName, details || {}, req?.ip, req?.headers?.['user-agent']]
    );
  } catch (e) { /* non-critical */ }
}
