import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { space_id, status } = req.query;
    let sql = `SELECT p.*,
        s.name as space_name,
        COUNT(DISTINCT pm.user_id) as member_count,
        COUNT(DISTINCT f.id) as file_count,
        COALESCE(SUM(f.size), 0) as storage_used
       FROM projects p
       JOIN spaces s ON p.space_id = s.id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN files f ON p.id = f.project_id AND f.is_trashed=false
       WHERE s.org_id=$1`;
    const params = [req.user.org_id];
    let idx = 2;
    if (space_id) { sql += ` AND p.space_id=$${idx++}`; params.push(space_id); }
    if (status) { sql += ` AND p.status=$${idx++}`; params.push(status); }
    sql += ' GROUP BY p.id, s.name ORDER BY p.created_at DESC';
    const result = await query(sql, params);
    res.json({ projects: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, space_id, description, color } = req.body;
    if (!name || !space_id) return res.status(400).json({ error: 'Name and space required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const result = await query(
      `INSERT INTO projects (space_id, name, slug, description, color, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [space_id, name, slug, description, color, req.user.id]
    );
    await query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3)', [result.rows[0].id, req.user.id, 'admin']);
    await logActivity(req.user.org_id, req.user.id, 'created_project', 'project', result.rows[0].id, name, {}, req);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, color, status } = req.body;
    const fields = []; const params = []; let idx = 1;
    if (name) { fields.push(`name=$${idx++}`); params.push(name); }
    if (description !== undefined) { fields.push(`description=$${idx++}`); params.push(description); }
    if (color) { fields.push(`color=$${idx++}`); params.push(color); }
    if (status) { fields.push(`status=$${idx++}`); params.push(status); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    params.push(req.params.id);
    const result = await query(`UPDATE projects SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query('DELETE FROM projects WHERE id=$1 RETURNING name', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
    await logActivity(req.user.org_id, req.user.id, 'deleted_project', 'project', req.params.id, result.rows[0].name, {}, req);
    res.json({ message: 'Project deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
