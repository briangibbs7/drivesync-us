import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, org_id: user.org_id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Register (first user becomes admin and creates org)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, orgName } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });

    const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const slug = (orgName || name).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);

    // Create org
    const orgRes = await query(
      'INSERT INTO organizations (name, slug, domain) VALUES ($1, $2, $3) RETURNING id',
      [orgName || `${name}'s Workspace`, slug, email.split('@')[1]]
    );
    const orgId = orgRes.rows[0].id;

    // Create user as admin
    const userRes = await query(
      `INSERT INTO users (org_id, email, name, password_hash, role, status)
       VALUES ($1,$2,$3,$4,'admin','active') RETURNING id, email, name, role, org_id`,
      [orgId, email, name, hash]
    );
    const user = userRes.rows[0];
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query(
      'SELECT id, email, name, password_hash, role, org_id, status FROM users WHERE email=$1',
      [email]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    if (user.status !== 'active') return res.status(403).json({ error: 'Account is not active' });
    if (!user.password_hash) return res.status(400).json({ error: 'Use Google login for this account' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await query('UPDATE users SET last_active_at=NOW() WHERE id=$1', [user.id]);
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { credential, orgId } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Check if user exists
    let result = await query('SELECT * FROM users WHERE google_id=$1 OR email=$2', [googleId, email]);
    let user;

    if (result.rows.length) {
      user = result.rows[0];
      await query('UPDATE users SET google_id=$1, avatar_url=$2, last_active_at=NOW() WHERE id=$3',
        [googleId, picture, user.id]);
    } else {
      // Auto-provision if org allows it
      if (!orgId) return res.status(400).json({ error: 'Organization ID required for new users' });
      const org = await query('SELECT * FROM organizations WHERE id=$1', [orgId]);
      if (!org.rows.length) return res.status(404).json({ error: 'Organization not found' });

      const domain = email.split('@')[1];
      const orgDomain = org.rows[0].domain;
      const role = orgDomain && domain === orgDomain ? 'member' : 'external';

      result = await query(
        `INSERT INTO users (org_id, email, name, google_id, avatar_url, role, status)
         VALUES ($1,$2,$3,$4,$5,$6,'active') RETURNING *`,
        [orgId, email, name, googleId, picture, role]
      );
      user = result.rows[0];
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, o.name as org_name, o.slug as org_slug
       FROM users u JOIN organizations o ON u.org_id = o.id WHERE u.id=$1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    delete user.password_hash;
    delete user.mfa_secret;
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
