import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { sendPasswordReset as sendPasswordResetEmail } from '../services/email.js'; const sendPasswordChangedEmail = async () => {};
import { logger } from '../logger.js';

const router = Router();
const APP_URL = process.env.APP_URL || 'http://localhost';

// ─── Request password reset ────────────────────────────────────────────
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Always return success to prevent email enumeration
    const userRes = await query('SELECT id, name, email FROM users WHERE email=$1', [email]);
    if (!userRes.rows.length) {
      return res.json({ message: 'If an account exists, a reset email has been sent' });
    }

    const user = userRes.rows[0];

    // Invalidate any existing tokens for this user
    await query('UPDATE password_resets SET used=true WHERE user_id=$1 AND used=false', [user.id]);

    // Create new token
    const tokenRes = await query(
      'INSERT INTO password_resets (user_id) VALUES ($1) RETURNING token',
      [user.id]
    );
    const token = tokenRes.rows[0].token;
    const resetUrl = `${APP_URL}/#reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetUrl: resetUrl,
    });

    logger.info(`Password reset requested for ${email}`);
    res.json({ message: 'If an account exists, a reset email has been sent' });
  } catch (e) {
    logger.error('Password reset request error:', e.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ─── Verify reset token ───────────────────────────────────────────────
router.get('/reset/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const result = await query(
      `SELECT pr.*, u.email, u.name FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token=$1 AND pr.used=false AND pr.expires_at > NOW()`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    res.json({ valid: true, email: result.rows[0].email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Reset password with token ────────────────────────────────────────
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const result = await query(
      `SELECT pr.*, u.email, u.name FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token=$1 AND pr.used=false AND pr.expires_at > NOW()`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const row = result.rows[0];
    const hash = await bcrypt.hash(password, 12);

    // Update password
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, row.user_id]);

    // Mark token as used
    await query('UPDATE password_resets SET used=true WHERE id=$1', [row.id]);

    // Send confirmation email
    await sendPasswordChangedEmail({
      to: row.email,
      userName: row.name,
    });

    logger.info(`Password reset completed for ${row.email}`);
    res.json({ message: 'Password has been reset. You can now sign in.' });
  } catch (e) {
    logger.error('Password reset error:', e.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ─── Change password (authenticated) ──────────────────────────────────
router.post('/change', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const userRes = await query('SELECT password_hash, email, name FROM users WHERE id=$1', [req.user.id]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });

    const user = userRes.rows[0];

    if (user.password_hash) {
      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);

    await sendPasswordChangedEmail({
      to: user.email,
      userName: user.name,
    });

    logger.info(`Password changed for ${user.email}`);
    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
