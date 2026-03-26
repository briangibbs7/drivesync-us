import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { logger } from '../logger.js';

const router = Router();

function generatePortalToken(user, portalId) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'external', org_id: user.org_id, name: user.name, portal_id: portalId, is_portal: true },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function portalAuth(req, res, next) {
  const header = req.headers.authorization;
  const queryToken = req.query.token;
  if ((!header || !header.startsWith('Bearer ')) && !queryToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = queryToken || header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.is_portal) return res.status(403).json({ error: 'Portal access required' });
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// ─── Get portal info (public) ──────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, slug, brand_color, logo_url, welcome_message, require_sso, allow_signup, type FROM portals WHERE slug=$1',
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Portal not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal login ──────────────────────────────────────────────────────
router.post('/:slug/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Find portal
    const portalRes = await query('SELECT * FROM portals WHERE slug=$1', [req.params.slug]);
    if (!portalRes.rows.length) return res.status(404).json({ error: 'Portal not found' });
    const portal = portalRes.rows[0];

    // Find user
    const userRes = await query('SELECT * FROM users WHERE email=$1 AND org_id=$2', [email, portal.org_id]);
    if (!userRes.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = userRes.rows[0];

    // Check password
    if (!user.password_hash) return res.status(401).json({ error: 'Account not set up. Contact administrator.' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Check portal access
    const accessRes = await query(
      'SELECT * FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [portal.id, user.id]
    );
    if (!accessRes.rows.length) return res.status(403).json({ error: 'You do not have access to this portal' });
    const access = accessRes.rows[0];

    // Check expiry
    if (access.expires_at && new Date(access.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Your access has expired. Contact administrator.' });
    }

    await query('UPDATE users SET last_active_at=NOW() WHERE id=$1', [user.id]);

    const token = generatePortalToken(user, portal.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url },
      portal: { id: portal.id, name: portal.name, brand_color: portal.brand_color, logo_url: portal.logo_url },
      access: { permission: access.permission, project_ids: access.project_ids, space_ids: access.space_ids, company: access.company },
    });
  } catch (e) {
    logger.error('Portal login error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: get current user + access info ────────────────────────────
router.get('/:slug/me', portalAuth, async (req, res) => {
  try {
    const userRes = await query(
      'SELECT id, email, name, avatar_url, last_active_at FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });

    const accessRes = await query(
      `SELECT pa.*, p.name as portal_name, p.brand_color, p.logo_url
       FROM portal_access pa JOIN portals p ON pa.portal_id = p.id
       WHERE pa.portal_id=$1 AND pa.user_id=$2 AND pa.is_active=true`,
      [req.user.portal_id, req.user.id]
    );

    res.json({
      user: userRes.rows[0],
      access: accessRes.rows[0] || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: list accessible projects ──────────────────────────────────
router.get('/:slug/projects', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT project_ids, space_ids, permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length) return res.status(403).json({ error: 'No access' });
    const access = accessRes.rows[0];

    let projects = [];
    if (access.project_ids && access.project_ids.length > 0) {
      const result = await query(
        `SELECT p.*, s.name as space_name,
          COUNT(DISTINCT f.id) as file_count,
          COALESCE(SUM(f.size), 0) as storage_used
         FROM projects p
         JOIN spaces s ON p.space_id = s.id
         LEFT JOIN files f ON p.id = f.project_id AND f.is_trashed=false
         WHERE p.id = ANY($1)
         GROUP BY p.id, s.name`,
        [access.project_ids]
      );
      projects = result.rows;
    } else if (access.space_ids && access.space_ids.length > 0) {
      // If no specific projects, show all projects in allowed spaces
      const result = await query(
        `SELECT p.*, s.name as space_name,
          COUNT(DISTINCT f.id) as file_count,
          COALESCE(SUM(f.size), 0) as storage_used
         FROM projects p
         JOIN spaces s ON p.space_id = s.id
         LEFT JOIN files f ON p.id = f.project_id AND f.is_trashed=false
         WHERE p.space_id = ANY($1)
         GROUP BY p.id, s.name`,
        [access.space_ids]
      );
      projects = result.rows;
    }

    res.json({ projects, permission: access.permission });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: list files in a project ───────────────────────────────────
router.get('/:slug/projects/:projectId/files', portalAuth, async (req, res) => {
  try {
    // Verify access to this project
    const accessRes = await query(
      'SELECT project_ids, space_ids, permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length) return res.status(403).json({ error: 'No access' });
    const access = accessRes.rows[0];

    // Check project is in allowed list
    const projRes = await query('SELECT * FROM projects WHERE id=$1', [req.params.projectId]);
    if (!projRes.rows.length) return res.status(404).json({ error: 'Project not found' });
    const proj = projRes.rows[0];

    const hasProjectAccess = access.project_ids?.includes(proj.id);
    const hasSpaceAccess = access.space_ids?.includes(proj.space_id);
    if (!hasProjectAccess && !hasSpaceAccess) return res.status(403).json({ error: 'No access to this project' });

    const parentId = req.query.parent_id || null;
    let sql = `SELECT f.*, u.name as owner_name, lu.name as locked_by_name FROM files f LEFT JOIN users u ON f.owner_id = u.id LEFT JOIN users lu ON f.locked_by = lu.id
               WHERE f.project_id=$1 AND f.is_trashed=false`;
    const params = [req.params.projectId];
    let idx = 2;

    if (parentId) {
      sql += ` AND f.parent_id=$${idx++}`;
      params.push(parentId);
    } else {
      sql += ' AND f.parent_id IS NULL';
    }

    sql += ' ORDER BY f.is_folder DESC, f.updated_at DESC';
    const result = await query(sql, params);
    res.json({ files: result.rows, permission: access.permission });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: download file ─────────────────────────────────────────────
router.get('/:slug/files/:fileId/download', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length) return res.status(403).json({ error: 'No access' });
    if (accessRes.rows[0].permission === 'view') return res.status(403).json({ error: 'Download not permitted. You have view-only access.' });

    const fileRes = await query('SELECT * FROM files WHERE id=$1 AND is_trashed=false', [req.params.fileId]);
    if (!fileRes.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = fileRes.rows[0];

    if (file.is_folder) return res.status(400).json({ error: 'Cannot download a folder' });
    res.download(file.storage_path, file.name);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: get file metadata (for viewing/editing) ──────────────────
router.get('/:slug/files/:fileId', portalAuth, async (req, res) => {
  try {
    const fileRes = await query(
      'SELECT f.*, u.name as owner_name FROM files f LEFT JOIN users u ON f.owner_id=u.id WHERE f.id=$1 AND f.is_trashed=false',
      [req.params.fileId]
    );
    if (!fileRes.rows.length) return res.status(404).json({ error: 'File not found' });
    res.json(fileRes.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: update file (edit permission required) ────────────────────
router.patch('/:slug/files/:fileId', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length) return res.status(403).json({ error: 'No access' });
    if (accessRes.rows[0].permission !== 'edit') return res.status(403).json({ error: 'Edit not permitted' });

    const { name, metadata } = req.body;
    const fields = []; const params = []; let idx = 1;
    if (name) { fields.push(`name=$${idx++}`); params.push(name); }
    if (metadata) { fields.push(`metadata=$${idx++}`); params.push(JSON.stringify(metadata)); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.fileId);
    const result = await query(`UPDATE files SET ${fields.join(', ')} WHERE id=$${idx} AND is_trashed=false RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: upload file to project (edit permission) ──────────────────
router.post('/:slug/projects/:projectId/upload', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length || accessRes.rows[0].permission !== 'edit') {
      return res.status(403).json({ error: 'Upload not permitted' });
    }
    // Forward to the main upload handler logic - for now return a message
    res.status(501).json({ error: 'Use the main file upload endpoint with portal token' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Admin: invite customer to portal ──────────────────────────────────
// (also sets up password for the external user)
router.post('/:slug/invite', async (req, res) => {
  try {
    // This needs admin auth
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'manager') return res.status(403).json({ error: 'Admin/manager required' });

    const { email, name, password, company, permission, project_ids, space_ids, expires_days } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'Email, name, and password required' });

    const portalRes = await query('SELECT * FROM portals WHERE slug=$1', [req.params.slug]);
    if (!portalRes.rows.length) return res.status(404).json({ error: 'Portal not found' });
    const portal = portalRes.rows[0];

    // Create or update user
    const hash = await bcrypt.hash(password, 12);
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

    // Set portal access
    const expiresAt = expires_days ? new Date(Date.now() + expires_days * 86400000) : null;
    await query(
      `INSERT INTO portal_access (portal_id, user_id, permission, company, project_ids, space_ids, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (portal_id, user_id) DO UPDATE
       SET permission=$3, company=$4, project_ids=$5, space_ids=$6, expires_at=$7, is_active=true`,
      [portal.id, user.id, permission || 'view', company, project_ids || [], space_ids || [], expiresAt]
    );

    res.status(201).json({ message: 'Customer invited', user_id: user.id, email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Portal: preview/stream file
router.get('/:slug/files/:fileId/preview', portalAuth, async (req, res) => {
  try {
    const fileRes = await query('SELECT * FROM files WHERE id=$1 AND is_trashed=false', [req.params.fileId]);
    if (!fileRes.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = fileRes.rows[0];
    if (file.is_folder) return res.status(400).json({ error: 'Cannot preview a folder' });

    const fs = await import('fs');
    if (!fs.default.existsSync(file.storage_path)) return res.status(404).json({ error: 'File not found on disk' });

    const stat = fs.default.statSync(file.storage_path);
    const mimeType = file.mime_type || 'application/octet-stream';

    const range = req.headers.range;
    if (range && (mimeType.startsWith('video/') || mimeType.startsWith('audio/'))) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const stream = fs.default.createReadStream(file.storage_path, { start, end });
      res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': chunkSize, 'Content-Type': mimeType });
      stream.pipe(res);
    } else {
      res.set({ 'Content-Type': mimeType, 'Content-Length': stat.size, 'Cache-Control': 'private, max-age=3600' });
      fs.default.createReadStream(file.storage_path).pipe(res);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Portal: upload file (edit permission required)
router.post('/:slug/projects/:projectId/files/upload', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length || accessRes.rows[0].permission !== 'edit') {
      return res.status(403).json({ error: 'Upload not permitted — edit access required' });
    }

    // Use multer for file handling
    const multer = await import('multer');
    const path = await import('path');
    const { v4: uuidv4 } = await import('uuid');
    const mime = await import('mime-types');
    const fs = await import('fs');

    const DATA_DIR = process.env.DATA_DIR || '/var/lib/drivesync';
    const storage = multer.default.diskStorage({
      destination: (r, f, cb) => cb(null, path.default.join(DATA_DIR, 'temp')),
      filename: (r, f, cb) => cb(null, uuidv4() + path.default.extname(f.originalname)),
    });
    const upload = multer.default({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

    // Process upload manually
    upload.array('files', 10)(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files provided' });

      const results = [];
      for (const file of req.files) {
        const fileId = uuidv4();
        const ext = path.default.extname(file.originalname);
        const storagePath = path.default.join(DATA_DIR, 'uploads', req.user.org_id, fileId.substring(0, 2), fileId + ext);

        await fs.promises.mkdir(path.default.dirname(storagePath), { recursive: true });
        await fs.promises.rename(file.path, storagePath);

        const mimeType = mime.default.lookup(file.originalname) || 'application/octet-stream';
        const result = await query(
          `INSERT INTO files (id, org_id, project_id, parent_id, name, mime_type, size, storage_path, owner_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [fileId, req.user.org_id, req.params.projectId, req.body.parent_id || null,
           file.originalname, mimeType, file.size, storagePath, req.user.id]
        );
        results.push(result.rows[0]);
      }

      res.status(201).json({ files: results });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Portal: create folder (edit permission required)
router.post('/:slug/projects/:projectId/files/folder', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length || accessRes.rows[0].permission !== 'edit') {
      return res.status(403).json({ error: 'Folder creation not permitted — edit access required' });
    }

    const { name, parent_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name required' });

    const result = await query(
      `INSERT INTO files (org_id, project_id, parent_id, name, is_folder, owner_id)
       VALUES ($1,$2,$3,$4,true,$5) RETURNING *`,
      [req.user.org_id, req.params.projectId, parent_id || null, name, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── OTP Login Flow ────────────────────────────────────────────────────

// Request OTP code
router.post('/:slug/otp/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const portalRes = await query('SELECT * FROM portals WHERE slug=$1', [req.params.slug]);
    if (!portalRes.rows.length) return res.status(404).json({ error: 'Portal not found' });
    const portal = portalRes.rows[0];

    // Find user
    const userRes = await query('SELECT * FROM users WHERE email=$1 AND org_id=$2', [email, portal.org_id]);
    if (!userRes.rows.length) {
      // Don't reveal if user exists — still return success
      return res.json({ message: 'If an account exists, a code has been sent.' });
    }
    const user = userRes.rows[0];

    // Check portal access
    const accessRes = await query(
      'SELECT * FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [portal.id, user.id]
    );
    if (!accessRes.rows.length) {
      return res.json({ message: 'If an account exists, a code has been sent.' });
    }

    // Invalidate previous codes
    await query('UPDATE otp_codes SET used=true WHERE email=$1 AND used=false', [email]);

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await query(
      'INSERT INTO otp_codes (user_id, email, code, portal_id) VALUES ($1,$2,$3,$4)',
      [user.id, email, code, portal.id]
    );

    // Send email
    let emailMod;
    try { emailMod = await import('../services/email.js'); } catch(e) {}
    if (emailMod && emailMod.sendOTPCode) {
      await emailMod.sendOTPCode({
        to: email,
        name: user.name,
        code,
        portalName: portal.name,
        expiresMinutes: 10,
      });
    }

    res.json({ message: 'If an account exists, a code has been sent.' });
  } catch (e) {
    logger.error('OTP request error:', e);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify OTP code and login
router.post('/:slug/otp/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

    const portalRes = await query('SELECT * FROM portals WHERE slug=$1', [req.params.slug]);
    if (!portalRes.rows.length) return res.status(404).json({ error: 'Portal not found' });
    const portal = portalRes.rows[0];

    // Find valid OTP
    const otpRes = await query(
      `SELECT o.*, u.name, u.email as user_email, u.role, u.org_id, u.avatar_url
       FROM otp_codes o JOIN users u ON o.user_id = u.id
       WHERE o.email=$1 AND o.code=$2 AND o.portal_id=$3 AND o.used=false AND o.expires_at > NOW() AND o.attempts < 5`,
      [email, code, portal.id]
    );

    if (!otpRes.rows.length) {
      // Increment attempts on all matching codes
      await query(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE email=$1 AND portal_id=$2 AND used=false',
        [email, portal.id]
      );
      return res.status(401).json({ error: 'Invalid or expired code. Please try again.' });
    }

    const otp = otpRes.rows[0];

    // Mark as used
    await query('UPDATE otp_codes SET used=true WHERE id=$1', [otp.id]);
    await query('UPDATE users SET last_active_at=NOW() WHERE id=$1', [otp.user_id]);

    // Get access
    const accessRes = await query(
      'SELECT * FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [portal.id, otp.user_id]
    );
    const access = accessRes.rows[0] || {};

    // Generate token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: otp.user_id, email: otp.user_email, role: otp.role || 'external', org_id: otp.org_id, name: otp.name, portal_id: portal.id, is_portal: true },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: { id: otp.user_id, name: otp.name, email: otp.user_email, avatar_url: otp.avatar_url },
      portal: { id: portal.id, name: portal.name, brand_color: portal.brand_color, logo_url: portal.logo_url },
      access: { permission: access.permission || 'view', project_ids: access.project_ids || [], space_ids: access.space_ids || [], company: access.company || '' },
    });
  } catch (e) {
    logger.error('OTP verify error:', e);
    res.status(500).json({ error: 'Verification failed' });
  }
});


// ─── Portal: Check out file (lock) ────────────────────────────────────
router.post('/:slug/files/:fileId/checkout', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length || accessRes.rows[0].permission !== 'edit') {
      return res.status(403).json({ error: 'Edit permission required to check out files' });
    }

    const fileRes = await query('SELECT * FROM files WHERE id=$1 AND is_trashed=false', [req.params.fileId]);
    if (!fileRes.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = fileRes.rows[0];

    if (file.locked_by && file.locked_by !== req.user.id) {
      const lockerRes = await query('SELECT name FROM users WHERE id=$1', [file.locked_by]);
      const lockerName = lockerRes.rows[0]?.name || 'another user';
      return res.status(409).json({ error: 'File is checked out by ' + lockerName + ' since ' + new Date(file.locked_at).toLocaleString() });
    }

    const note = req.body.note || '';
    await query('UPDATE files SET locked_by=$1, locked_at=NOW(), lock_note=$2 WHERE id=$3',
      [req.user.id, note, req.params.fileId]);

    res.json({ message: 'File checked out', locked_by: req.user.id, locked_at: new Date() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: Check in file (unlock + optional new version) ───────────
router.post('/:slug/files/:fileId/checkin', portalAuth, async (req, res) => {
  try {
    const fileRes = await query('SELECT * FROM files WHERE id=$1 AND is_trashed=false', [req.params.fileId]);
    if (!fileRes.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = fileRes.rows[0];

    if (file.locked_by && file.locked_by !== req.user.id) {
      return res.status(403).json({ error: 'File is checked out by another user' });
    }

    // Unlock the file
    await query('UPDATE files SET locked_by=NULL, locked_at=NULL, lock_note=NULL WHERE id=$1', [req.params.fileId]);

    res.json({ message: 'File checked in successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: Upload new version (check-in with new file) ─────────────
router.post('/:slug/files/:fileId/new-version', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length || accessRes.rows[0].permission !== 'edit') {
      return res.status(403).json({ error: 'Edit permission required' });
    }

    const fileRes = await query('SELECT * FROM files WHERE id=$1 AND is_trashed=false', [req.params.fileId]);
    if (!fileRes.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = fileRes.rows[0];

    if (file.locked_by && file.locked_by !== req.user.id) {
      return res.status(403).json({ error: 'File is checked out by another user' });
    }

    const multer = await import('multer');
    const path = await import('path');
    const { v4: uuidv4 } = await import('uuid');
    const fs = await import('fs');

    const DATA_DIR = process.env.DATA_DIR || '/var/lib/drivesync';
    const storage = multer.default.diskStorage({
      destination: (r, f, cb) => cb(null, path.default.join(DATA_DIR, 'temp')),
      filename: (r, f, cb) => cb(null, uuidv4() + path.default.extname(f.originalname)),
    });
    const upload = multer.default({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file provided' });

      try {
        // Save current version to file_versions
        await query(
          'INSERT INTO file_versions (file_id, version, size, storage_path, uploaded_by) VALUES ($1,$2,$3,$4,$5)',
          [file.id, file.version, file.size, file.storage_path, file.owner_id]
        );

        // Move new file to storage
        const ext = path.default.extname(req.file.originalname);
        const newPath = path.default.join(DATA_DIR, 'uploads', req.user.org_id, file.id.substring(0, 2), file.id + '-v' + (file.version + 1) + ext);
        await fs.promises.mkdir(path.default.dirname(newPath), { recursive: true });
        await fs.promises.rename(req.file.path, newPath);

        // Update file record
        const mime = (await import('mime-types')).default;
        const mimeType = mime.lookup(req.file.originalname) || file.mime_type;
        await query(
          'UPDATE files SET version=version+1, size=$1, storage_path=$2, mime_type=$3, locked_by=NULL, locked_at=NULL, lock_note=NULL WHERE id=$4 RETURNING *',
          [req.file.size, newPath, mimeType, file.id]
        );

        const updated = await query('SELECT * FROM files WHERE id=$1', [file.id]);
        res.json({ message: 'New version uploaded', file: updated.rows[0] });
      } catch (e) {
        // Clean up temp file
        try { await fs.promises.unlink(req.file.path); } catch(x) {}
        res.status(500).json({ error: e.message });
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: Get version history ──────────────────────────────────────
router.get('/:slug/files/:fileId/versions', portalAuth, async (req, res) => {
  try {
    const versions = await query(
      `SELECT fv.*, u.name as uploaded_by_name FROM file_versions fv
       LEFT JOIN users u ON fv.uploaded_by = u.id
       WHERE fv.file_id=$1 ORDER BY fv.version DESC`,
      [req.params.fileId]
    );
    // Also get current file info
    const current = await query(
      `SELECT f.version, f.size, f.updated_at, f.locked_by, f.locked_at, f.lock_note, u.name as locked_by_name, o.name as owner_name
       FROM files f LEFT JOIN users u ON f.locked_by = u.id LEFT JOIN users o ON f.owner_id = o.id WHERE f.id=$1`,
      [req.params.fileId]
    );
    res.json({
      current: current.rows[0] || null,
      versions: versions.rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Portal: Download specific version ────────────────────────────────
router.get('/:slug/files/:fileId/versions/:versionId/download', portalAuth, async (req, res) => {
  try {
    const accessRes = await query(
      'SELECT permission FROM portal_access WHERE portal_id=$1 AND user_id=$2 AND is_active=true',
      [req.user.portal_id, req.user.id]
    );
    if (!accessRes.rows.length || accessRes.rows[0].permission === 'view') {
      return res.status(403).json({ error: 'Download permission required' });
    }

    const vRes = await query('SELECT fv.*, f.name FROM file_versions fv JOIN files f ON fv.file_id=f.id WHERE fv.id=$1', [req.params.versionId]);
    if (!vRes.rows.length) return res.status(404).json({ error: 'Version not found' });
    res.download(vRes.rows[0].storage_path, 'v' + vRes.rows[0].version + '-' + vRes.rows[0].name);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
