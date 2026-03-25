import { Router } from 'express';
import email from '../services/email.js';
import { query } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [users, files, storage, shares, servers] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=$2) as active FROM users WHERE org_id=$1', [req.user.org_id, 'active']),
      query('SELECT COUNT(*) as total, COALESCE(SUM(size),0) as total_size FROM files WHERE org_id=$1 AND is_trashed=false', [req.user.org_id]),
      query('SELECT storage_quota FROM organizations WHERE id=$1', [req.user.org_id]),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active=true) as active FROM share_links sl JOIN files f ON sl.file_id=f.id WHERE f.org_id=$1', [req.user.org_id]),
      query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='connected') as connected FROM network_servers WHERE org_id=$1", [req.user.org_id]),
    ]);

    res.json({
      users: { total: parseInt(users.rows[0].total), active: parseInt(users.rows[0].active) },
      files: { total: parseInt(files.rows[0].total), total_size: parseInt(files.rows[0].total_size) },
      storage: { quota: parseInt(storage.rows[0].storage_quota), used: parseInt(files.rows[0].total_size) },
      shares: { total: parseInt(shares.rows[0].total), active: parseInt(shares.rows[0].active) },
      servers: { total: parseInt(servers.rows[0].total), connected: parseInt(servers.rows[0].connected) },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/org', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM organizations WHERE id=$1', [req.user.org_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Org not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/org', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, domain, settings, storage_quota } = req.body;
    const fields = []; const params = []; let idx = 1;
    if (name) { fields.push(`name=$${idx++}`); params.push(name); }
    if (domain) { fields.push(`domain=$${idx++}`); params.push(domain); }
    if (settings) { fields.push(`settings=$${idx++}`); params.push(settings); }
    if (storage_quota) { fields.push(`storage_quota=$${idx++}`); params.push(storage_quota); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(req.user.org_id);
    const result = await query(`UPDATE organizations SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`, params);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Email config status
router.get('/email-status', authenticate, authorize('admin'), async (req, res) => {
  res.json({
    configured: email.isConfigured(),
    from: process.env.EMAIL_FROM || 'not set',
    provider: 'resend',
  });
});

// Send test email
router.post('/email-test', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Email address required' });
    const result = await email.sendTestEmail(to);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Multi-region status
router.get('/region-status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const region = process.env.REGION || 'us';
    const appUrl = process.env.APP_URL || 'http://localhost';
    const usServer = process.env.US_SERVER || null;
    const dbUrl = process.env.DATABASE_URL || '';

    // Check if DB is local or remote
    const dbHost = dbUrl.match(/@([^:\/]+)/)?.[1] || 'localhost';
    const dbIsRemote = dbHost !== '127.0.0.1' && dbHost !== 'localhost';

    // Get DB stats
    const dbStats = await query('SELECT COUNT(*) as users FROM users');
    const fileStats = await query('SELECT COUNT(*) as files, COALESCE(SUM(size),0) as total_size FROM files WHERE is_trashed=false');

    // Regions config
    const regions = [
      { id: 'us', name: 'United States', domain: 'drive-us.syberjet.com', url: 'https://drive-us.syberjet.com', flag: '🇺🇸', role: 'primary' },
      { id: 'asia', name: 'Asia', domain: 'drive-asia.syberjet.com', url: 'https://drive-asia.syberjet.com', flag: '🇯🇵', role: 'secondary' },
    ];

    // Ping the other region
    const otherRegion = regions.find(r => r.id !== region);
    let otherStatus = { reachable: false, latency: null };

    if (otherRegion) {
      try {
        const start = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(otherRegion.url + '/api/health', { signal: controller.signal });
        clearTimeout(timeout);
        const data = await resp.json();
        otherStatus = { reachable: data.status === 'ok', latency: Date.now() - start };
      } catch (e) {
        otherStatus = { reachable: false, latency: null, error: e.message };
      }
    }

    // Check DB connectivity
    let dbStatus = { connected: false, latency: null };
    try {
      const dbStart = Date.now();
      await query('SELECT 1');
      dbStatus = { connected: true, latency: Date.now() - dbStart };
    } catch (e) {
      dbStatus = { connected: false, error: e.message };
    }

    res.json({
      currentRegion: region,
      appUrl,
      regions,
      otherRegion: otherRegion ? { ...otherRegion, ...otherStatus } : null,
      database: {
        ...dbStatus,
        host: dbHost,
        isRemote: dbIsRemote,
        users: parseInt(dbStats.rows[0].users),
        files: parseInt(fileStats.rows[0].files),
        totalSize: parseInt(fileStats.rows[0].total_size),
      },
      server: {
        hostname: process.env.HOSTNAME || 'unknown',
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
