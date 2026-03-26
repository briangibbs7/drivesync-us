import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';
import { mountDrive, unmountDrive, isDriveMounted, browseDrive, importFile, scanDrive, testSMB, listShares } from '../services/drives.js';
import { logger } from '../logger.js';

const router = Router();

// List drives
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM drives WHERE org_id=$1 ORDER BY name', [req.user.org_id]);
    // Check actual mount status for each
    for (const drive of result.rows) {
      const mounted = await isDriveMounted(drive.id);
      if (mounted && drive.status !== 'connected') {
        await query("UPDATE drives SET status='connected' WHERE id=$1", [drive.id]);
        drive.status = 'connected';
      } else if (!mounted && drive.status === 'connected') {
        await query("UPDATE drives SET status='disconnected' WHERE id=$1", [drive.id]);
        drive.status = 'disconnected';
      }
    }
    res.json({ drives: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Test connection (without mounting)
router.post('/test', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { host, share_name, username, password, domain } = req.body;
    if (!host) return res.status(400).json({ error: 'Host required' });
    const result = await testSMB(host, share_name || '', username || 'guest', password || '', domain || '');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List available shares on a server
router.post('/list-shares', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { host, username, password, domain } = req.body;
    if (!host) return res.status(400).json({ error: 'Host required' });
    const result = await listShares(host, username || 'guest', password || '', domain || '');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add and mount a drive
router.post('/', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { name, server_host, share_name, username, password, domain, auto_mount, read_only } = req.body;
    if (!name || !server_host || !share_name) return res.status(400).json({ error: 'Name, host, and share name required' });

    // Create drive record
    const result = await query(
      `INSERT INTO drives (org_id, name, server_host, share_name, username, domain, auto_mount, read_only, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.org_id, name, server_host, share_name, username || 'guest', domain || '', auto_mount !== false, read_only || false, req.user.id]
    );
    const drive = result.rows[0];

    // Try to mount
    try {
      await mountDrive(drive, password);
      drive.status = 'connected';

      // Scan in background
      scanDrive(drive.id).catch(() => {});
    } catch (mountErr) {
      drive.status = 'error';
      drive.mount_error = mountErr.message;
    }

    await logActivity(req.user.org_id, req.user.id, 'added_drive', 'drive', drive.id, name, { host: server_host, share: share_name }, req);
    res.status(201).json(drive);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Connect (mount) a drive
router.post('/:id/connect', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { password } = req.body;
    const driveRes = await query('SELECT * FROM drives WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!driveRes.rows.length) return res.status(404).json({ error: 'Drive not found' });

    const result = await mountDrive(driveRes.rows[0], password);
    scanDrive(req.params.id).catch(() => {});
    res.json({ success: true, mountPoint: result.mountPoint });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Disconnect (unmount) a drive
router.post('/:id/disconnect', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    await unmountDrive(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Browse drive contents
router.get('/:id/browse', authenticate, async (req, res) => {
  try {
    const driveRes = await query('SELECT * FROM drives WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!driveRes.rows.length) return res.status(404).json({ error: 'Drive not found' });

    const mounted = await isDriveMounted(req.params.id);
    if (!mounted) return res.status(400).json({ error: 'Drive is not connected' });

    const subPath = req.query.path || '';
    const files = await browseDrive(req.params.id, subPath);
    res.json({ path: subPath || '/', files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Import file from drive into DriveSync
router.post('/:id/import', authenticate, async (req, res) => {
  try {
    const { file_path, parent_id } = req.body;
    if (!file_path) return res.status(400).json({ error: 'File path required' });

    const driveRes = await query('SELECT * FROM drives WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!driveRes.rows.length) return res.status(404).json({ error: 'Drive not found' });

    const result = await importFile(req.params.id, file_path, req.user.org_id, req.user.id, parent_id);

    const fileRes = await query(
      `INSERT INTO files (id, org_id, parent_id, name, mime_type, size, storage_path, owner_id, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [result.id, req.user.org_id, parent_id || null, result.name, result.mimeType, result.size,
       result.localPath, req.user.id,
       JSON.stringify({ source_drive: req.params.id, source_path: file_path })]
    );

    await query('UPDATE users SET storage_used = storage_used + $1 WHERE id=$2', [result.size, req.user.id]);
    await logActivity(req.user.org_id, req.user.id, 'imported_file', 'file', result.id, result.name,
      { drive: driveRes.rows[0].name, path: file_path }, req);

    res.json(fileRes.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rescan drive stats
router.post('/:id/scan', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const result = await scanDrive(req.params.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Remove drive
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await unmountDrive(req.params.id);
    const result = await query('DELETE FROM drives WHERE id=$1 AND org_id=$2 RETURNING name', [req.params.id, req.user.org_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Drive not found' });
    await logActivity(req.user.org_id, req.user.id, 'removed_drive', 'drive', req.params.id, result.rows[0].name, {}, req);
    res.json({ message: 'Drive removed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
