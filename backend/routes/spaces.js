import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, COUNT(DISTINCT sm.user_id) as member_count, COALESCE(SUM(f.size), 0) as storage_used
       FROM spaces s LEFT JOIN space_members sm ON s.id = sm.space_id
       LEFT JOIN files f ON s.id = f.space_id AND f.is_trashed=false
       WHERE s.org_id=$1 GROUP BY s.id ORDER BY s.name`,
      [req.user.org_id]
    );
    res.json({ spaces: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { name, icon, color, description, default_role, storage_quota } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await query(
      `INSERT INTO spaces (org_id, name, slug, icon, color, description, default_role, storage_quota, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.org_id, name, slug, icon, color, description, default_role || 'member', storage_quota || 0, req.user.id]
    );
    await query('INSERT INTO space_members (space_id, user_id, role) VALUES ($1,$2,$3)', [result.rows[0].id, req.user.id, 'admin']);
    await logActivity(req.user.org_id, req.user.id, 'created_space', 'space', result.rows[0].id, name, {}, req);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Space already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const { name, icon, color, description, default_role, storage_quota } = req.body;
    const fields = []; const params = []; let idx = 1;
    if (name !== undefined) { fields.push('name=$' + idx++); params.push(name); }
    if (icon !== undefined) { fields.push('icon=$' + idx++); params.push(icon); }
    if (color !== undefined) { fields.push('color=$' + idx++); params.push(color); }
    if (description !== undefined) { fields.push('description=$' + idx++); params.push(description); }
    if (default_role !== undefined) { fields.push('default_role=$' + idx++); params.push(default_role); }
    if (storage_quota !== undefined) { fields.push('storage_quota=$' + idx++); params.push(storage_quota); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(req.params.id, req.user.org_id);
    const result = await query('UPDATE spaces SET ' + fields.join(', ') + ' WHERE id=$' + idx++ + ' AND org_id=$' + idx + ' RETURNING *', params);
    if (!result.rows.length) return res.status(404).json({ error: 'Space not found' });
    await logActivity(req.user.org_id, req.user.id, 'updated_space', 'space', req.params.id, result.rows[0].name, {}, req);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authenticate, authorize('admin', 'file_manager'), async (req, res) => {
  try {
    const result = await query('DELETE FROM spaces WHERE id=$1 AND org_id=$2 RETURNING name', [req.params.id, req.user.org_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Space not found' });
    await logActivity(req.user.org_id, req.user.id, 'deleted_space', 'space', req.params.id, result.rows[0].name, {}, req);
    res.json({ message: 'Space deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/quota', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.storage_quota, COALESCE(SUM(f.size), 0) as storage_used, COUNT(f.id) as file_count
       FROM spaces s LEFT JOIN files f ON s.id = f.space_id AND f.is_trashed=false
       WHERE s.id=$1 AND s.org_id=$2 GROUP BY s.id`,
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Space not found' });
    const r = result.rows[0];
    const q = parseInt(r.storage_quota); const u = parseInt(r.storage_used);
    res.json({ quota: q, used: u, files: parseInt(r.file_count), remaining: q > 0 ? Math.max(0, q - u) : null, unlimited: q === 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/members', authenticate, authorize('admin', 'file_manager', 'manager'), async (req, res) => {
  try {
    const { user_id, role = 'member' } = req.body;
    await query('INSERT INTO space_members (space_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (space_id, user_id) DO UPDATE SET role=$3', [req.params.id, user_id, role]);
    res.json({ message: 'Member added' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/members/:userId', authenticate, authorize('admin', 'file_manager', 'manager'), async (req, res) => {
  try {
    await query('DELETE FROM space_members WHERE space_id=$1 AND user_id=$2', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
