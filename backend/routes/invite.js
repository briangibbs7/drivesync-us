import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { sendUserInvite as sendWelcomeEmail } from '../services/email.js';

const router = Router();
const APP_URL = process.env.APP_URL || 'http://localhost';

// ─── Accept invite and set password ───────────────────────────────────
router.post('/accept', async (req, res) => {
  try {
    const { token, password, name } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const result = await query(
      `SELECT u.*, o.name as org_name FROM users u
       JOIN organizations o ON u.org_id = o.id
       WHERE u.invite_token=$1 AND u.status='pending'`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const user = result.rows[0];
    const hash = await bcrypt.hash(password, 12);
    const updateName = name || user.name;

    await query(
      `UPDATE users SET password_hash=$1, status='active', name=$2, invite_token=NULL, last_active_at=NOW() WHERE id=$3`,
      [hash, updateName, user.id]
    );

    // Send welcome email
    await sendWelcomeEmail({
      to: user.email,
      userName: updateName,
      orgName: user.org_name,
    });

    // Generate login token
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, org_id: user.org_id, name: updateName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token: jwtToken, user: { id: user.id, email: user.email, name: updateName, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Verify invite token ──────────────────────────────────────────────
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const result = await query(
      `SELECT u.email, u.name, u.role, o.name as org_name FROM users u
       JOIN organizations o ON u.org_id = o.id
       WHERE u.invite_token=$1 AND u.status='pending'`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const row = result.rows[0];
    res.json({ valid: true, email: row.email, name: row.name, role: row.role, orgName: row.org_name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
