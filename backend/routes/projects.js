import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { space_id, status } = req.query;
    const role = req.user.role;
    let sql;
    const params = [req.user.org_id];
    let idx = 2;

    if (role === 'admin') {
      // Admin sees all projects
      sql = `SELECT p.*, s.name as space_name,
          COUNT(DISTINCT pm.user_id) as member_count,
          COUNT(DISTINCT f.id) as file_count,
          COALESCE(SUM(f.size), 0) as storage_used
         FROM projects p
         JOIN spaces s ON p.space_id = s.id
         LEFT JOIN project_members pm ON p.id = pm.project_id
         LEFT JOIN files f ON p.id = f.project_id AND f.is_trashed=false
         WHERE s.org_id=$1`;
    } else if (role === 'project_manager') {
      // Project manager: only projects they are a member of
      sql = `SELECT p.*, s.name as space_name,
          COUNT(DISTINCT pm.user_id) as member_count,
          COUNT(DISTINCT f.id) as file_count,
          COALESCE(SUM(f.size), 0) as storage_used
         FROM projects p
         JOIN spaces s ON p.space_id = s.id
         INNER JOIN project_members mypm ON p.id = mypm.project_id AND mypm.user_id = $${idx++}
         LEFT JOIN project_members pm ON p.id = pm.project_id
         LEFT JOIN files f ON p.id = f.project_id AND f.is_trashed=false
         WHERE s.org_id=$1`;
      params.push(req.user.id);
    } else {
      // file_manager, member, viewer: projects in spaces they belong to
      sql = `SELECT p.*, s.name as space_name,
          COUNT(DISTINCT pm.user_id) as member_count,
          COUNT(DISTINCT f.id) as file_count,
          COALESCE(SUM(f.size), 0) as storage_used
         FROM projects p
         JOIN spaces s ON p.space_id = s.id
         INNER JOIN space_members mysm ON s.id = mysm.space_id AND mysm.user_id = $${idx++}
         LEFT JOIN project_members pm ON p.id = pm.project_id
         LEFT JOIN files f ON p.id = f.project_id AND f.is_trashed=false
         WHERE s.org_id=$1`;
      params.push(req.user.id);
    }

    if (space_id) { sql += ` AND p.space_id=$${idx++}`; params.push(space_id); }
    if (status) { sql += ` AND p.status=$${idx++}`; params.push(status); }
    sql += ' GROUP BY p.id, s.name ORDER BY p.created_at DESC';
    const result = await query(sql, params);
    res.json({ projects: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
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

router.patch('/:id', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
  try {
    // Project managers can only edit projects they are a member of
    if (req.user.role === 'project_manager') {
      const memberCheck = await query(
        'SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2',
        [req.params.id, req.user.id]
      );
      if (!memberCheck.rows.length) return res.status(403).json({ error: 'You can only edit projects you are assigned to' });
    }

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


// Add member to project
router.post('/:id/members', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
  try {
    // Project managers can only add members to their own projects
    if (req.user.role === 'project_manager') {
      const check = await query('SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
      if (!check.rows.length) return res.status(403).json({ error: 'You can only manage members of your own projects' });
    }
    const { user_id, role = 'member' } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID required' });
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (project_id, user_id) DO UPDATE SET role=$3',
      [req.params.id, user_id, role]
    );
    res.json({ message: 'Member added' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Remove member from project
router.delete('/:id/members/:userId', authenticate, authorize('admin', 'project_manager'), async (req, res) => {
  try {
    if (req.user.role === 'project_manager') {
      const check = await query('SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
      if (!check.rows.length) return res.status(403).json({ error: 'You can only manage members of your own projects' });
    }
    await query('DELETE FROM project_members WHERE project_id=$1 AND user_id=$2', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// List project members
router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT pm.*, u.name, u.email, u.role as user_role, u.avatar_url, u.last_active_at
       FROM project_members pm JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id=$1 ORDER BY pm.joined_at`,
      [req.params.id]
    );
    res.json({ members: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
