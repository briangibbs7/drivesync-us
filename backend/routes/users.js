import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';
import { sendUserInvite as sendInviteEmail } from '../services/email.js';

const router = Router();
const APP_URL = process.env.APP_URL || 'http://localhost';

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, status, search } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT id, email, name, role, status, department, avatar_url, storage_used, storage_quota, last_active_at, created_at
               FROM users WHERE org_id=$1`;
    const params = [req.user.org_id];
    let idx = 2;

    if (role) { sql += ` AND role=$${idx++}`; params.push(role); }
    if (status) { sql += ` AND status=$${idx++}`; params.push(status); }
    if (search) { sql += ` AND (name ILIKE $${idx} OR email ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    const countRes = await query('SELECT COUNT(*) FROM users WHERE org_id=$1', [req.user.org_id]);
    res.json({ users: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, role, status, department, avatar_url, storage_used, storage_quota, last_active_at, settings, created_at
       FROM users WHERE id=$1 AND org_id=$2`,
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/invite', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { email, name, role = 'member', department, spaceIds = [] } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email and name required' });

    const existing = await query('SELECT id FROM users WHERE email=$1 AND org_id=$2', [email, req.user.org_id]);
    if (existing.rows.length) return res.status(409).json({ error: 'User already exists' });

    // Generate invite token
    const inviteToken = crypto.randomBytes(48).toString('hex');

    const result = await query(
      `INSERT INTO users (org_id, email, name, role, department, status, invite_token, invited_by)
       VALUES ($1,$2,$3,$4,$5,'pending',$6,$7) RETURNING *`,
      [req.user.org_id, email, name, role, department, inviteToken, req.user.id]
    );

    // Add to spaces
    for (const spaceId of spaceIds) {
      await query('INSERT INTO space_members (space_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [spaceId, result.rows[0].id, role]);
    }

    // Get org name and inviter name for email
    const orgRes = await query('SELECT name FROM organizations WHERE id=$1', [req.user.org_id]);
    const orgName = orgRes.rows[0]?.name || 'your organization';
    const inviteUrl = `${APP_URL}/#invite?token=${inviteToken}`;

    // Send invite email
    await sendInviteEmail({
      to: email,
      inviterName: req.user.name,
      orgName: orgName,
      role: role,
      inviteUrl: inviteUrl,
    });

    await logActivity(req.user.org_id, req.user.id, 'invited_user', 'user', result.rows[0].id, name, { email, role }, req);

    const user = result.rows[0];
    delete user.password_hash;
    delete user.invite_token;
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Resend invite
router.post('/:id/resend-invite', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const userRes = await query(
      `SELECT u.*, o.name as org_name FROM users u JOIN organizations o ON u.org_id=o.id WHERE u.id=$1 AND u.org_id=$2 AND u.status='pending'`,
      [req.params.id, req.user.org_id]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'Pending user not found' });

    const user = userRes.rows[0];
    let token = user.invite_token;

    // Generate new token if missing
    if (!token) {
      token = crypto.randomBytes(48).toString('hex');
      await query('UPDATE users SET invite_token=$1 WHERE id=$2', [token, user.id]);
    }

    const inviteUrl = `${APP_URL}/#invite?token=${token}`;

    await sendInviteEmail({
      to: user.email,
      inviterName: req.user.name,
      orgName: user.org_name,
      role: user.role,
      inviteUrl: inviteUrl,
    });

    res.json({ message: 'Invite resent' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { role, status, department, storage_quota } = req.body;
    const fields = [];
    const params = [];
    let idx = 1;

    if (role) { fields.push(`role=$${idx++}`); params.push(role); }
    if (status) { fields.push(`status=$${idx++}`); params.push(status); }
    if (department !== undefined) { fields.push(`department=$${idx++}`); params.push(department); }
    if (storage_quota) { fields.push(`storage_quota=$${idx++}`); params.push(storage_quota); }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id, req.user.org_id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id=$${idx++} AND org_id=$${idx} RETURNING id, email, name, role, status, department`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

    await logActivity(req.user.org_id, req.user.id, 'updated_user', 'user', req.params.id, result.rows[0].name, req.body, req);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    const result = await query('UPDATE users SET status=$1 WHERE id=$2 AND org_id=$3 RETURNING id, name', ['suspended', req.params.id, req.user.org_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    await logActivity(req.user.org_id, req.user.id, 'suspended_user', 'user', req.params.id, result.rows[0].name, {}, req);
    res.json({ message: 'User suspended' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Permanently delete user
router.delete('/:id/permanent', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    
    // Remove portal access first
    await query('DELETE FROM portal_access WHERE user_id=$1', [req.params.id]);
    // Remove space memberships
    await query('DELETE FROM space_members WHERE user_id=$1', [req.params.id]);
    // Remove project memberships
    await query('DELETE FROM project_members WHERE user_id=$1', [req.params.id]);
    
    const result = await query('DELETE FROM users WHERE id=$1 AND org_id=$2 RETURNING name, email', [req.params.id, req.user.org_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    
    await logActivity(req.user.org_id, req.user.id, 'deleted_user', 'user', req.params.id, result.rows[0].name, { email: result.rows[0].email }, req);
    res.json({ message: 'User permanently deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reactivate suspended user
router.post('/:id/reactivate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query("UPDATE users SET status='active' WHERE id=$1 AND org_id=$2 RETURNING id, name", [req.params.id, req.user.org_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    await logActivity(req.user.org_id, req.user.id, 'reactivated_user', 'user', req.params.id, result.rows[0].name, {}, req);
    res.json({ message: 'User reactivated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
