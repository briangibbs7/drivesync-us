import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';
import { testConnection, listRemoteDir, downloadFile, syncFromServer } from '../services/sync.js';
import { logger } from '../logger.js';

const router = Router();

// List all servers
router.get('/', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const result = await query(
      `SELECT ns.*, s.name as space_name FROM network_servers ns
       LEFT JOIN spaces s ON ns.local_space_id = s.id
       WHERE ns.org_id=$1 ORDER BY ns.created_at DESC`,
      [req.user.org_id]
    );
    // Strip credentials from response
    const servers = result.rows.map(s => ({
      ...s,
      credential: s.credential ? '***' : null,
      has_credential: !!s.credential,
    }));
    res.json({ servers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add a new server
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, host, port, protocol, username, credential, remote_path,
            local_space_id, sync_direction, sync_interval, sync_deletions, auto_sync } = req.body;
    if (!name || !host) return res.status(400).json({ error: 'Name and host required' });

    const result = await query(
      `INSERT INTO network_servers
       (org_id, name, host, port, protocol, username, credential, remote_path,
        local_space_id, sync_direction, sync_interval, sync_deletions, auto_sync)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user.org_id, name, host, port || 22, protocol || 'sftp', username || 'root',
       credential || null, remote_path || '/', local_space_id || null,
       sync_direction || 'bidirectional', sync_interval || 300,
       sync_deletions || false, auto_sync !== false]
    );

    await logActivity(req.user.org_id, req.user.id, 'added_server', 'server', result.rows[0].id, name, { host }, req);
    const server = result.rows[0];
    server.credential = server.credential ? '***' : null;
    res.status(201).json(server);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Test connection
router.post('/:id/test', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const serverRes = await query('SELECT * FROM network_servers WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!serverRes.rows.length) return res.status(404).json({ error: 'Server not found' });

    const result = await testConnection(serverRes.rows[0]);

    if (result.success) {
      await query("UPDATE network_servers SET status='connected' WHERE id=$1", [req.params.id]);
    } else {
      await query("UPDATE network_servers SET status='disconnected' WHERE id=$1", [req.params.id]);
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Browse remote directory
router.get('/:id/browse', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const serverRes = await query('SELECT * FROM network_servers WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!serverRes.rows.length) return res.status(404).json({ error: 'Server not found' });

    const remotePath = req.query.path || serverRes.rows[0].remote_path || '/';
    const files = await listRemoteDir(serverRes.rows[0], remotePath);

    await query("UPDATE network_servers SET status='connected' WHERE id=$1", [req.params.id]);

    res.json({ path: remotePath, files });
  } catch (e) {
    await query("UPDATE network_servers SET status='disconnected' WHERE id=$1", [req.params.id]);
    res.status(500).json({ error: e.message });
  }
});

// Download specific file from remote
router.post('/:id/pull', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { remote_path, parent_id } = req.body;
    if (!remote_path) return res.status(400).json({ error: 'Remote path required' });

    const serverRes = await query('SELECT * FROM network_servers WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!serverRes.rows.length) return res.status(404).json({ error: 'Server not found' });

    const result = await downloadFile(serverRes.rows[0], remote_path, null, req.user.org_id, req.user.id);

    // Create file record
    const fileRes = await query(
      `INSERT INTO files (id, org_id, parent_id, name, mime_type, size, storage_path, owner_id, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [result.id, req.user.org_id, parent_id || null, result.name, result.mimeType, result.size,
       result.localPath, req.user.id,
       JSON.stringify({ sync_server_id: req.params.id, remote_path: remote_path, synced_at: new Date().toISOString() })]
    );

    await query('UPDATE users SET storage_used = storage_used + $1 WHERE id=$2', [result.size, req.user.id]);

    await logActivity(req.user.org_id, req.user.id, 'pulled_file', 'file', result.id, result.name,
      { server: serverRes.rows[0].name, remote_path }, req);

    res.json(fileRes.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Full sync from server
router.post('/:id/sync', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const serverRes = await query('SELECT * FROM network_servers WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!serverRes.rows.length) return res.status(404).json({ error: 'Server not found' });

    // Run sync in background, respond immediately
    res.json({ message: 'Sync started', status: 'syncing' });

    // Async sync
    syncFromServer(req.params.id, req.user.org_id, req.user.id)
      .then(result => {
        logger.info(`Sync completed for ${serverRes.rows[0].name}: ${result.synced} synced, ${result.skipped} skipped, ${result.failed} failed`);
      })
      .catch(err => {
        logger.error(`Sync failed for ${serverRes.rows[0].name}: ${err.message}`);
      });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get sync log
router.get('/:id/log', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM sync_log WHERE server_id=$1 ORDER BY started_at DESC LIMIT 50`,
      [req.params.id]
    );
    res.json({ log: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update server
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, host, port, protocol, username, credential, remote_path,
            sync_direction, sync_interval, sync_deletions, auto_sync, status } = req.body;
    const fields = []; const params = []; let idx = 1;
    const map = { name, host, port, protocol, username, credential, remote_path,
                  sync_direction, sync_interval, sync_deletions, auto_sync, status };
    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined) { fields.push(`${k}=$${idx++}`); params.push(v); }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(req.params.id, req.user.org_id);
    const result = await query(
      `UPDATE network_servers SET ${fields.join(', ')} WHERE id=$${idx++} AND org_id=$${idx} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Server not found' });
    const server = result.rows[0];
    server.credential = server.credential ? '***' : null;
    res.json(server);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete server
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query('DELETE FROM network_servers WHERE id=$1 AND org_id=$2 RETURNING name', [req.params.id, req.user.org_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Server not found' });
    await logActivity(req.user.org_id, req.user.id, 'removed_server', 'server', req.params.id, result.rows[0].name, {}, req);
    res.json({ message: 'Server removed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
