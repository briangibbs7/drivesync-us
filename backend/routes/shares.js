import { Router } from 'express';
import { sendShareNotification } from '../services/email.js';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authenticate, logActivity } from '../middleware/auth.js';

const router = Router();
const APP_URL = process.env.APP_URL || 'http://localhost';

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT sl.*, f.name as file_name, f.is_folder, u.name as created_by_name
       FROM share_links sl
       JOIN files f ON sl.file_id = f.id
       LEFT JOIN users u ON sl.created_by = u.id
       WHERE f.org_id=$1 ORDER BY sl.created_at DESC`,
      [req.user.org_id]
    );
    res.json({ shares: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { file_id, recipient_email, permission, expires_days, password, max_downloads, allow_reshare, message } = req.body;
    if (!file_id) return res.status(400).json({ error: 'File ID required' });

    const file = await query('SELECT * FROM files WHERE id=$1 AND org_id=$2', [file_id, req.user.org_id]);
    if (!file.rows.length) return res.status(404).json({ error: 'File not found' });

    let passwordHash = null;
    if (password) passwordHash = await bcrypt.hash(password, 10);

    const expiresAt = expires_days ? new Date(Date.now() + expires_days * 86400000) : null;

    const result = await query(
      `INSERT INTO share_links (file_id, created_by, recipient_email, permission, password_hash, expires_at, max_downloads, allow_reshare)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [file_id, req.user.id, recipient_email, permission || 'view', passwordHash, expiresAt, max_downloads, allow_reshare || false]
    );

    await logActivity(req.user.org_id, req.user.id, 'shared', 'file', file_id, file.rows[0].name,
      { recipient: recipient_email, permission }, req);

    // Send share email if recipient specified
    if (recipient_email) {
      try {
        const shareUrl = `${APP_URL}/#share?token=${result.rows[0].token}`;
        await sendShareEmail({
          to: recipient_email,
          sharerName: req.user.name,
          fileName: file.rows[0].name,
          permission: permission || 'view',
          shareUrl: shareUrl,
          expiresAt: expiresAt,
          message: message,
        });
      } catch (emailErr) { /* email failure is non-critical */ }
    }

    
    // Send email notification if recipient specified
    if (recipient_email) {
      const userRes = await query('SELECT name FROM users WHERE id=$1', [req.user.id]);
      const senderName = userRes.rows[0]?.name || 'Someone';
      const shareToken = result.rows[0].token;
      const shareUrl = (process.env.APP_URL || 'http://localhost') + '/share/' + shareToken;
      sendShareNotification({
        to: recipient_email,
        fileName: file.rows[0].name,
        sharedBy: senderName,
        permission: permission || 'view',
        expiresAt: expiresAt,
        shareUrl,
        hasPassword: !!password,
      }).catch(() => {});
    }

    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public access (no auth required)
router.get('/public/:token', async (req, res) => {
  try {
    const result = await query(
      `SELECT sl.*, f.name as file_name, f.size, f.mime_type, f.is_folder, f.storage_path
       FROM share_links sl JOIN files f ON sl.file_id = f.id
       WHERE sl.token=$1 AND sl.is_active=true`,
      [req.params.token]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Link not found or expired' });
    const share = result.rows[0];
    if (share.expires_at && new Date(share.expires_at) < new Date()) return res.status(410).json({ error: 'Link expired' });
    if (share.max_downloads && share.download_count >= share.max_downloads) return res.status(410).json({ error: 'Download limit reached' });

    await query('UPDATE share_links SET access_count = access_count + 1, last_accessed=NOW() WHERE id=$1', [share.id]);
    res.json({ name: share.file_name, size: share.size, type: share.mime_type, permission: share.permission, has_password: !!share.password_hash });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET download for non-password shares
// Serve file inline for viewing (no download header)
router.get('/public/:token/view', async (req, res) => {
  try {
    const result = await query(
      `SELECT sl.*, f.name as file_name, f.mime_type, f.storage_path, f.size
       FROM share_links sl JOIN files f ON sl.file_id = f.id
       WHERE sl.token=$1 AND sl.is_active=true`,
      [req.params.token]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Link not found' });
    const share = result.rows[0];
    if (share.expires_at && new Date(share.expires_at) < new Date()) return res.status(410).json({ error: 'Link expired' });
    if (share.password_hash && !req.query.pw) return res.status(401).json({ error: 'Password required' });
    if (share.password_hash && req.query.pw) {
      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.default.compare(req.query.pw, share.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid password' });
    }
    await query('UPDATE share_links SET access_count = access_count + 1, last_accessed=NOW() WHERE id=$1', [share.id]);
    const mime = share.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', 'inline; filename="' + share.file_name + '"');
    res.setHeader('Content-Length', share.size);
    const fs = await import('fs');
    fs.default.createReadStream(share.storage_path).pipe(res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/public/:token/download', async (req, res) => {
  try {
    const result = await query(
      `SELECT sl.*, f.name as file_name, f.storage_path FROM share_links sl JOIN files f ON sl.file_id = f.id
       WHERE sl.token=$1 AND sl.is_active=true`,
      [req.params.token]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Link not found' });
    const share = result.rows[0];
    if (share.expires_at && new Date(share.expires_at) < new Date()) return res.status(410).json({ error: 'Link expired' });
    if (share.password_hash) return res.status(401).json({ error: 'Password required - use POST' });
    if (share.permission === 'view') return res.status(403).json({ error: 'Download not permitted' });
    await query('UPDATE share_links SET download_count = download_count + 1 WHERE id=$1', [share.id]);
    res.download(share.storage_path, share.file_name);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/public/:token/download', async (req, res) => {
  try {
    const { password } = req.body;
    const result = await query(
      `SELECT sl.*, f.name as file_name, f.storage_path FROM share_links sl JOIN files f ON sl.file_id = f.id
       WHERE sl.token=$1 AND sl.is_active=true`,
      [req.params.token]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Link not found' });
    const share = result.rows[0];

    if (share.password_hash) {
      if (!password) return res.status(401).json({ error: 'Password required' });
      const valid = await bcrypt.compare(password, share.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid password' });
    }

    if (share.permission === 'view') return res.status(403).json({ error: 'Download not permitted' });

    await query('UPDATE share_links SET download_count = download_count + 1 WHERE id=$1', [share.id]);
    res.download(share.storage_path, share.file_name);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Update share link
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { permission, expires_days, max_downloads, allow_reshare, password, is_active } = req.body;

    // Build update dynamically
    const updates = [];
    const params = [];
    let idx = 1;

    if (permission) { updates.push(`permission=$${idx++}`); params.push(permission); }
    if (max_downloads !== undefined) { updates.push(`max_downloads=$${idx++}`); params.push(max_downloads || null); }
    if (allow_reshare !== undefined) { updates.push(`allow_reshare=$${idx++}`); params.push(allow_reshare); }
    if (is_active !== undefined) { updates.push(`is_active=$${idx++}`); params.push(is_active); }

    if (password !== undefined) {
      if (!password) {
        updates.push('password_hash=NULL');
      } else {
        const hash = await (await import('bcryptjs')).default.hash(password, 10);
        updates.push(`password_hash=$${idx++}`);
        params.push(hash);
      }
    }

    if (expires_days !== undefined) {
      if (expires_days === null || expires_days === '' || expires_days === 0) {
        updates.push('expires_at=NULL');
      } else {
        const newExpiry = new Date(Date.now() + parseInt(expires_days) * 86400000);
        updates.push(`expires_at=$${idx++}`);
        params.push(newExpiry);
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.id);
    const sql = `UPDATE share_links SET ${updates.join(', ')} WHERE id=$${idx} RETURNING *`;
    await query(sql, params);

    // Return full share with file name
    const result = await query(
      `SELECT sl.*, f.name as file_name, u.name as created_by_name
       FROM share_links sl JOIN files f ON sl.file_id = f.id LEFT JOIN users u ON sl.created_by = u.id
       WHERE sl.id=$1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Share not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send share notification to additional recipients
router.post('/:id/resend', authenticate, async (req, res) => {
  try {
    const { emails, message } = req.body;
    if (!emails || !emails.length) return res.status(400).json({ error: 'At least one email required' });

    const shareRes = await query(
      `SELECT sl.*, f.name as file_name FROM share_links sl JOIN files f ON sl.file_id = f.id
       WHERE sl.id=$1 AND sl.is_active=true`, [req.params.id]
    );
    if (!shareRes.rows.length) return res.status(404).json({ error: 'Share not found' });
    const share = shareRes.rows[0];

    const APP_URL = process.env.APP_URL || 'http://localhost';
    const shareUrl = `${APP_URL}/#share?token=${share.token}`;
    const { sendShareEmail } = await import('../services/email.js');

    const results = [];
    for (const email of emails) {
      try {
        await sendShareEmail({
          to: email.trim(),
          sharerName: req.user.name,
          fileName: share.file_name,
          permission: share.permission,
          shareUrl: shareUrl,
          expiresAt: share.expires_at,
          message: message,
        });
        results.push({ email: email.trim(), status: 'sent' });
      } catch (err) {
        results.push({ email: email.trim(), status: 'failed', error: err.message });
      }
    }
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.delete('/:id', authenticate, async (req, res) => {
  try {
    await query(
      `UPDATE share_links SET is_active=false WHERE id=$1 AND created_by=$2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Share link deactivated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
