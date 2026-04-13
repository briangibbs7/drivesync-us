import { Router } from 'express';
import { sendPortalInvite } from '../services/email.js';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

// List all portals
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, COUNT(pa.id) as member_count
       FROM portals p LEFT JOIN portal_access pa ON p.id = pa.portal_id AND pa.is_active=true
       WHERE p.org_id=$1 GROUP BY p.id ORDER BY p.created_at DESC`,
      [req.user.org_id]
    );
    res.json({ portals: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single portal
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, COUNT(pa.id) as member_count
       FROM portals p LEFT JOIN portal_access pa ON p.id = pa.portal_id AND pa.is_active=true
       WHERE p.id=$1 AND p.org_id=$2 GROUP BY p.id`,
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Portal not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create portal
router.post('/', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { type, name, custom_domain, brand_color, welcome_message, require_sso, require_mfa, allow_signup, watermark_files } = req.body;
    if (!type || !name) return res.status(400).json({ error: 'Type and name required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await query(
      `INSERT INTO portals (org_id, type, name, slug, custom_domain, brand_color, welcome_message, require_sso, require_mfa, allow_signup, watermark_files)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.org_id, type, name, slug, custom_domain, brand_color || '#4F8EF7', welcome_message,
       require_sso || false, require_mfa || false, allow_signup || false, watermark_files !== false]
    );
    await logActivity(req.user.org_id, req.user.id, 'created_portal', 'portal', result.rows[0].id, name, { type }, req);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'A portal with this name already exists' });
    res.status(500).json({ error: e.message });
  }
});

// Update portal
router.patch('/:id', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { name, custom_domain, brand_color, welcome_message, require_sso, require_mfa, allow_signup, watermark_files } = req.body;
    const fields = []; const params = []; let idx = 1;
    if (name !== undefined) { fields.push(`name=$${idx++}`); params.push(name); }
    if (custom_domain !== undefined) { fields.push(`custom_domain=$${idx++}`); params.push(custom_domain || null); }
    if (brand_color !== undefined) { fields.push(`brand_color=$${idx++}`); params.push(brand_color); }
    if (welcome_message !== undefined) { fields.push(`welcome_message=$${idx++}`); params.push(welcome_message || null); }
    if (require_sso !== undefined) { fields.push(`require_sso=$${idx++}`); params.push(require_sso); }
    if (require_mfa !== undefined) { fields.push(`require_mfa=$${idx++}`); params.push(require_mfa); }
    if (allow_signup !== undefined) { fields.push(`allow_signup=$${idx++}`); params.push(allow_signup); }
    if (watermark_files !== undefined) { fields.push(`watermark_files=$${idx++}`); params.push(watermark_files); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.id, req.user.org_id);
    const result = await query(
      `UPDATE portals SET ${fields.join(', ')} WHERE id=$${idx++} AND org_id=$${idx} RETURNING *`, params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Portal not found' });
    await logActivity(req.user.org_id, req.user.id, 'updated_portal', 'portal', req.params.id, result.rows[0].name, {}, req);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete portal
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM portals WHERE id=$1 AND org_id=$2 RETURNING name', [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Portal not found' });
    await logActivity(req.user.org_id, req.user.id, 'deleted_portal', 'portal', req.params.id, result.rows[0].name, {}, req);
    res.json({ message: 'Portal deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add/update portal access
router.post('/:id/access', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { user_id, permission, company, project_ids, space_ids, expires_days } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID required' });
    const expiresAt = expires_days ? new Date(Date.now() + expires_days * 86400000) : null;
    const result = await query(
      `INSERT INTO portal_access (portal_id, user_id, permission, company, project_ids, space_ids, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (portal_id, user_id) DO UPDATE
       SET permission=$3, company=$4, project_ids=$5, space_ids=$6, expires_at=$7, is_active=true RETURNING *`,
      [req.params.id, user_id, permission || 'view', company, project_ids || [], space_ids || [], expiresAt]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List portal access
router.get('/:id/access', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT pa.*, u.name, u.email, u.avatar_url, u.status as user_status, u.last_active_at
       FROM portal_access pa JOIN users u ON pa.user_id = u.id
       WHERE pa.portal_id=$1 ORDER BY pa.created_at DESC`,
      [req.params.id]
    );
    res.json({ access: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Revoke portal access
router.delete('/:id/access/:userId', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    await query(
      'UPDATE portal_access SET is_active=false WHERE portal_id=$1 AND user_id=$2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Access revoked' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Invite customer (creates user + grants access)
router.post('/:id/invite', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { email, name, password, company, permission, project_ids, space_ids, expires_days } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email and name required' });

    const portalRes = await query('SELECT * FROM portals WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!portalRes.rows.length) return res.status(404).json({ error: 'Portal not found' });
    const portal = portalRes.rows[0];

    const hash = password ? await bcrypt.hash(password, 12) : null;
    let userRes = await query('SELECT * FROM users WHERE email=$1 AND org_id=$2', [email, portal.org_id]);
    let user;
    if (userRes.rows.length) {
      user = userRes.rows[0];
      await query('UPDATE users SET password_hash=$1, name=$2, role=$3, status=$4 WHERE id=$5',
        [hash, name, 'external', 'active', user.id]);
    } else {
      userRes = await query(
        `INSERT INTO users (org_id, email, name, password_hash, role, status)
         VALUES ($1,$2,$3,$4,'external','active') RETURNING *`,
        [portal.org_id, email, name, hash]
      );
      user = userRes.rows[0];
    }

    const expiresAt = expires_days ? new Date(Date.now() + expires_days * 86400000) : null;
    await query(
      `INSERT INTO portal_access (portal_id, user_id, permission, company, project_ids, space_ids, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (portal_id, user_id) DO UPDATE
       SET permission=$3, company=$4, project_ids=$5, space_ids=$6, expires_at=$7, is_active=true`,
      [portal.id, user.id, permission || 'view', company, project_ids || [], space_ids || [], expiresAt]
    );

    await logActivity(req.user.org_id, req.user.id, 'invited_portal_user', 'portal', portal.id, name, { email, permission }, req);
    // Send invite email
    const projRes = project_ids && project_ids.length > 0
      ? await query('SELECT id, name, color FROM projects WHERE id = ANY($1)', [project_ids])
      : { rows: [] };

    const inviterRes = await query('SELECT name FROM users WHERE id=$1', [req.user.id]);
    const inviterName = inviterRes.rows[0]?.name || 'An administrator';

    const emailResult = await sendPortalInvite({
      to: email,
      customerName: name,
      portalName: portal.name,
      portalSlug: portal.slug,
      portalColor: portal.brand_color,
      permission: permission || 'view',
      company,
      projects: projRes.rows,
      password,
      expiresAt: expiresAt,
      invitedBy: inviterName,
    });

    res.status(201).json({ message: 'Customer invited', user_id: user.id, email, email_sent: emailResult.sent });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Add existing internal user to portal
router.post('/:id/add-member', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { user_id, permission, project_ids, space_ids, expires_days } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID required' });

    // Verify user exists in same org
    const userRes = await query('SELECT * FROM users WHERE id=$1 AND org_id=$2', [user_id, req.user.org_id]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });

    const expiresAt = expires_days ? new Date(Date.now() + expires_days * 86400000) : null;
    const result = await query(
      `INSERT INTO portal_access (portal_id, user_id, permission, company, project_ids, space_ids, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (portal_id, user_id) DO UPDATE
       SET permission=$3, project_ids=$5, space_ids=$6, expires_at=$7, is_active=true RETURNING *`,
      [req.params.id, user_id, permission || 'edit', 'Internal', project_ids || [], space_ids || [], expiresAt]
    );

    await logActivity(req.user.org_id, req.user.id, 'added_portal_member', 'portal', req.params.id, userRes.rows[0].name, { role: userRes.rows[0].role }, req);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Reinstate revoked portal access
router.post('/:id/access/:userId/reinstate', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const result = await query(
      'UPDATE portal_access SET is_active=true WHERE portal_id=$1 AND user_id=$2 RETURNING *',
      [req.params.id, req.params.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Access record not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update portal access (permission, projects, expiry)
router.patch('/:id/access/:userId', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { permission, project_ids, space_ids, company, expires_days } = req.body;
    const fields = []; const params = []; let idx = 1;
    if (permission !== undefined) { fields.push(`permission=$${idx++}`); params.push(permission); }
    if (project_ids !== undefined) { fields.push(`project_ids=$${idx++}`); params.push(project_ids); }
    if (space_ids !== undefined) { fields.push(`space_ids=$${idx++}`); params.push(space_ids); }
    if (company !== undefined) { fields.push(`company=$${idx++}`); params.push(company); }
    if (expires_days !== undefined) {
      const expiresAt = expires_days ? new Date(Date.now() + expires_days * 86400000) : null;
      fields.push(`expires_at=$${idx++}`);
      params.push(expiresAt);
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.id, req.params.userId);
    const result = await query(
      `UPDATE portal_access SET ${fields.join(', ')} WHERE portal_id=$${idx++} AND user_id=$${idx} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Access record not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
