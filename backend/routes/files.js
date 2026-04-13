import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import sharp from 'sharp';
import archiver from 'archiver';
import { query } from '../db.js';
import { authenticate, logActivity } from '../middleware/auth.js';

const router = Router();
const DATA_DIR = process.env.DATA_DIR || '/var/lib/drivesync';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(DATA_DIR, 'temp')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
  fileFilter: (req, file, cb) => {
    const blocked = ['.exe', '.bat', '.cmd', '.scr', '.pif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (blocked.includes(ext)) return cb(new Error('File type not allowed'));
    cb(null, true);
  },
});

// List files
router.get('/', authenticate, async (req, res) => {
  try {
    const { parent_id, space_id, project_id, search, starred, trashed, page = 1, limit = 50, sort = 'updated_at', order = 'DESC' } = req.query;
    let sql = `SELECT f.*, u.name as owner_name FROM files f LEFT JOIN users u ON f.owner_id = u.id WHERE f.org_id=$1`;

    // Scope files by role — non-admins only see files in their spaces/projects
    const role = req.user.role;
    if (role !== 'admin') {
      if (role === 'project_manager') {
        // Only files in projects they are a member of
        sql += ` AND (f.project_id IN (SELECT project_id FROM project_members WHERE user_id=$${idx++}) OR f.space_id IN (SELECT space_id FROM space_members WHERE user_id=$${idx}))`;
        params.push(req.user.id, req.user.id);
        idx++;
      } else {
        // file_manager, member, viewer: files in spaces they belong to
        sql += ` AND (f.space_id IN (SELECT space_id FROM space_members WHERE user_id=$${idx++}) OR f.project_id IN (SELECT p.id FROM projects p INNER JOIN space_members sm ON p.space_id = sm.space_id WHERE sm.user_id=$${idx}))`;
        params.push(req.user.id, req.user.id);
        idx++;
      }
    }
    const params = [req.user.org_id];
    let idx = 2;

    if (trashed === 'true') { sql += ' AND f.is_trashed=true'; }
    else { sql += ' AND f.is_trashed=false'; }

    if (parent_id) { sql += ` AND f.parent_id=$${idx++}`; params.push(parent_id); }
    else if (!search && !starred) { sql += ' AND f.parent_id IS NULL'; }

    if (space_id) { sql += ` AND f.space_id=$${idx++}`; params.push(space_id); }
    if (project_id) { sql += ` AND f.project_id=$${idx++}`; params.push(project_id); }
    if (starred === 'true') { sql += ' AND f.is_starred=true'; }
    if (search) { sql += ` AND f.name ILIKE $${idx++}`; params.push(`%${search}%`); }

    const allowed = ['name', 'size', 'updated_at', 'created_at'];
    const sortCol = allowed.includes(sort) ? sort : 'updated_at';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY f.is_folder DESC, f.${sortCol} ${sortDir}`;
    sql += ` LIMIT $${idx++} OFFSET $${idx}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    res.json({ files: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Upload file(s)
router.post('/upload', authenticate, upload.array('files', 20), async (req, res) => {
  try {
    const { parent_id, space_id, project_id } = req.body;

    // Check space quota if uploading to a space
    const spaceId = req.body.space_id;
    if (spaceId) {
      const spaceRes = await query(
        `SELECT s.storage_quota, COALESCE(SUM(f.size), 0) as storage_used
         FROM spaces s LEFT JOIN files f ON s.id = f.space_id AND f.is_trashed=false
         WHERE s.id=$1 GROUP BY s.id`,
        [spaceId]
      );
      if (spaceRes.rows.length) {
        const sq = spaceRes.rows[0];
        const quota = parseInt(sq.storage_quota);
        const used = parseInt(sq.storage_used);
        if (quota > 0) {
          const totalUpload = req.files.reduce((a, f) => a + f.size, 0);
          if (used + totalUpload > quota) {
            // Clean up temp files
            for (const f of req.files) { try { const fs2 = await import('fs'); fs2.default.unlinkSync(f.path); } catch(e){} }
            return res.status(413).json({ error: `Space storage quota exceeded. Used: \${Math.round(used/1048576)}MB, Quota: \${Math.round(quota/1048576)}MB, Upload: \${Math.round(totalUpload/1048576)}MB` });
          }
        }
      }
    }


    const results = [];

    for (const file of req.files) {
      const fileId = uuidv4();
      const ext = path.extname(file.originalname);
      const storagePath = path.join(DATA_DIR, 'uploads', req.user.org_id, fileId.substring(0, 2), `${fileId}${ext}`);

      await fs.mkdir(path.dirname(storagePath), { recursive: true });
      await fs.rename(file.path, storagePath);

      // Generate thumbnail for images
      let thumbUrl = null;
      const mimeType = mime.lookup(file.originalname) || 'application/octet-stream';
      if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
        try {
          const thumbPath = path.join(DATA_DIR, 'thumbnails', `${fileId}.webp`);
          await fs.mkdir(path.dirname(thumbPath), { recursive: true });
          await sharp(storagePath).resize(300, 300, { fit: 'inside' }).webp({ quality: 80 }).toFile(thumbPath);
          thumbUrl = `/api/files/${fileId}/thumbnail`;
        } catch (e) { /* ignore thumbnail failures */ }
      }

      const result = await query(
        `INSERT INTO files (id, org_id, space_id, project_id, parent_id, name, mime_type, size, storage_path, thumbnail_url, owner_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [fileId, req.user.org_id, space_id || null, project_id || null, parent_id || null,
         file.originalname, mimeType, file.size, storagePath, thumbUrl, req.user.id]
      );

      // Update user storage
      await query('UPDATE users SET storage_used = storage_used + $1 WHERE id=$2', [file.size, req.user.id]);

      await logActivity(req.user.org_id, req.user.id, 'uploaded', 'file', fileId, file.originalname, { size: file.size }, req);
      results.push(result.rows[0]);
    }

    res.status(201).json({ files: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create folder
router.post('/folder', authenticate, async (req, res) => {
  try {
    const { name, parent_id, space_id, project_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name required' });

    const result = await query(
      `INSERT INTO files (org_id, space_id, project_id, parent_id, name, is_folder, owner_id)
       VALUES ($1,$2,$3,$4,$5,true,$6) RETURNING *`,
      [req.user.org_id, space_id || null, project_id || null, parent_id || null, name, req.user.id]
    );

    await logActivity(req.user.org_id, req.user.id, 'created_folder', 'file', result.rows[0].id, name, {}, req);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Download file
// Serve file inline for preview
router.get('/:id/view', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) return res.status(401).json({ error: 'Auth required' });
    let orgId;
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      orgId = decoded.org_id;
    } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
    const result = await query('SELECT * FROM files WHERE id=$1 AND org_id=$2', [req.params.id, orgId]);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = result.rows[0];
    if (file.is_folder) return res.status(400).json({ error: 'Cannot view a folder' });
    const mime = file.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', 'inline; filename="' + file.name + '"');
    res.setHeader('Content-Length', file.size);
    const fs = await import('fs');
    fs.default.createReadStream(file.storage_path).pipe(res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM files WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = result.rows[0];
    if (file.is_folder) return res.status(400).json({ error: 'Cannot download a folder directly' });

    await logActivity(req.user.org_id, req.user.id, 'downloaded', 'file', file.id, file.name, {}, req);
    res.download(file.storage_path, file.name);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Star/unstar
router.patch('/:id/star', authenticate, async (req, res) => {
  try {
    const result = await query(
      'UPDATE files SET is_starred = NOT is_starred WHERE id=$1 AND org_id=$2 RETURNING id, is_starred',
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Move to trash
router.patch('/:id/trash', authenticate, async (req, res) => {
  try {
    const result = await query(
      'UPDATE files SET is_trashed=true, trashed_at=NOW() WHERE id=$1 AND org_id=$2 RETURNING id, name',
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    await logActivity(req.user.org_id, req.user.id, 'trashed', 'file', req.params.id, result.rows[0].name, {}, req);
    res.json({ message: 'Moved to trash' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Restore from trash
router.patch('/:id/restore', authenticate, async (req, res) => {
  try {
    const result = await query(
      'UPDATE files SET is_trashed=false, trashed_at=NULL WHERE id=$1 AND org_id=$2 RETURNING id, name',
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    res.json({ message: 'Restored' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rename / move / update metadata
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name, parent_id, space_id, project_id, metadata } = req.body;
    const fields = []; const params = []; let idx = 1;
    if (name) { fields.push(`name=$${idx++}`); params.push(name); }
    if (parent_id !== undefined) { fields.push(`parent_id=$${idx++}`); params.push(parent_id || null); }
    if (space_id !== undefined) { fields.push(`space_id=$${idx++}`); params.push(space_id || null); }
    if (project_id !== undefined) { fields.push(`project_id=$${idx++}`); params.push(project_id || null); }
    if (metadata !== undefined) { fields.push(`metadata=$${idx++}`); params.push(JSON.stringify(metadata)); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.id, req.user.org_id);
    const result = await query(`UPDATE files SET ${fields.join(', ')} WHERE id=$${idx++} AND org_id=$${idx} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Preview/stream file (inline display)
router.get('/:id/preview', async (req, res) => {
  try {
    let userId, orgId;
    const header = req.headers.authorization;
    const qToken = req.query.token;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : qToken;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      orgId = decoded.org_id;
    } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

    const result = await query('SELECT * FROM files WHERE id=$1 AND org_id=$2 AND is_trashed=false', [req.params.id, orgId]);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = result.rows[0];
    if (file.is_folder) return res.status(400).json({ error: 'Cannot preview a folder' });

    const fs = await import('fs');
    const path = await import('path');

    if (!fs.default.existsSync(file.storage_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    const stat = fs.default.statSync(file.storage_path);
    const mimeType = file.mime_type || 'application/octet-stream';

    // Handle range requests for video/audio streaming
    const range = req.headers.range;
    if (range && (mimeType.startsWith('video/') || mimeType.startsWith('audio/'))) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const stream = fs.default.createReadStream(file.storage_path, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      });
      stream.pipe(res);
    } else {
      res.set({
        'Content-Type': mimeType,
        'Content-Length': stat.size,
        'Content-Disposition': 'inline; filename="' + file.name.replace(/"/g, '\\"') + '"',
        'Cache-Control': 'private, max-age=3600',
      });
      fs.default.createReadStream(file.storage_path).pipe(res);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get file content as text (for code/text preview)
router.get('/:id/content', async (req, res) => {
  try {
    let userId, orgId;
    const header = req.headers.authorization;
    const qToken = req.query.token;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : qToken;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      orgId = decoded.org_id;
    } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

    const result = await query('SELECT * FROM files WHERE id=$1 AND org_id=$2 AND is_trashed=false', [req.params.id, orgId]);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = result.rows[0];

    const fs = await import('fs');
    // Only allow text-based files, limit to 2MB
    const stat = fs.default.statSync(file.storage_path);
    if (stat.size > 2 * 1024 * 1024) return res.status(413).json({ error: 'File too large for text preview' });

    const content = fs.default.readFileSync(file.storage_path, 'utf-8');
    res.json({ content, name: file.name, mime_type: file.mime_type, size: stat.size });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Check out file (lock)
router.post('/:id/checkout', authenticate, async (req, res) => {
  try {
    const fileRes = await query('SELECT * FROM files WHERE id=$1 AND org_id=$2 AND is_trashed=false', [req.params.id, req.user.org_id]);
    if (!fileRes.rows.length) return res.status(404).json({ error: 'File not found' });
    const file = fileRes.rows[0];
    if (file.locked_by && file.locked_by !== req.user.id) {
      const lockerRes = await query('SELECT name FROM users WHERE id=$1', [file.locked_by]);
      return res.status(409).json({ error: 'Checked out by ' + (lockerRes.rows[0]?.name || 'another user') });
    }
    await query('UPDATE files SET locked_by=$1, locked_at=NOW(), lock_note=$2 WHERE id=$3', [req.user.id, req.body.note || '', req.params.id]);
    await logActivity(req.user.org_id, req.user.id, 'checked_out', 'file', req.params.id, file.name, {}, req);
    res.json({ message: 'File checked out' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Check in file (unlock)
router.post('/:id/checkin', authenticate, async (req, res) => {
  try {
    const fileRes = await query('SELECT * FROM files WHERE id=$1 AND org_id=$2', [req.params.id, req.user.org_id]);
    if (!fileRes.rows.length) return res.status(404).json({ error: 'File not found' });
    if (fileRes.rows[0].locked_by && fileRes.rows[0].locked_by !== req.user.id) {
      return res.status(403).json({ error: 'Checked out by another user' });
    }
    await query('UPDATE files SET locked_by=NULL, locked_at=NULL, lock_note=NULL WHERE id=$1', [req.params.id]);
    await logActivity(req.user.org_id, req.user.id, 'checked_in', 'file', req.params.id, fileRes.rows[0].name, {}, req);
    res.json({ message: 'File checked in' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get version history
router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const versions = await query(
      `SELECT fv.*, u.name as uploaded_by_name FROM file_versions fv
       LEFT JOIN users u ON fv.uploaded_by = u.id WHERE fv.file_id=$1 ORDER BY fv.version DESC`,
      [req.params.id]
    );
    const current = await query(
      `SELECT f.version, f.size, f.updated_at, f.locked_by, f.locked_at, f.lock_note, u.name as locked_by_name
       FROM files f LEFT JOIN users u ON f.locked_by = u.id WHERE f.id=$1`,
      [req.params.id]
    );
    res.json({ current: current.rows[0], versions: versions.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
