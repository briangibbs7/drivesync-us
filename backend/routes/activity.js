import { Router } from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action, entity_type } = req.query;
    let sql = `SELECT al.*, u.name as user_name, u.avatar_url FROM activity_log al LEFT JOIN users u ON al.user_id = u.id WHERE al.org_id=$1`;
    const params = [req.user.org_id];
    let idx = 2;
    if (user_id) { sql += ` AND al.user_id=$${idx++}`; params.push(user_id); }
    if (action) { sql += ` AND al.action=$${idx++}`; params.push(action); }
    if (entity_type) { sql += ` AND al.entity_type=$${idx++}`; params.push(entity_type); }
    sql += ` ORDER BY al.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const result = await query(sql, params);
    res.json({ activity: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
