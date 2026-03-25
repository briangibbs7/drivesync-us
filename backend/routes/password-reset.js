import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { logger } from '../logger.js';

const router = Router();

let sendPasswordReset = null;
try {
  const emailMod = await import('../services/email.js');
  sendPasswordReset = emailMod.sendPasswordReset;
} catch (e) {
  logger.warn('Email service not available for password resets');
}

// Request password reset (public - no auth needed)
router.post('/forgot', async (req, res) => {
  try {
    const { email, portal_slug } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Find user
    const userRes = await query('SELECT id, email, name, org_id FROM users WHERE email=$1', [email]);
    
    // Always return success to prevent email enumeration
    if (!userRes.rows.length) {
      return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }
    const user = userRes.rows[0];

    // Invalidate any existing tokens
    await query('UPDATE password_resets SET used=true WHERE user_id=$1 AND used=false', [user.id]);

    // Create new token
    const tokenRes = await query(
      "INSERT INTO password_resets (user_id) VALUES ($1) RETURNING token, expires_at",
      [user.id]
    );
    const { token, expires_at } = tokenRes.rows[0];

    // Build reset URL
    const baseUrl = process.env.APP_URL || 'http://localhost';
    let resetUrl;
    if (portal_slug) {
      resetUrl = `${baseUrl}/portal/${portal_slug}?reset=${token}`;
    } else {
      resetUrl = `${baseUrl}/?reset=${token}`;
    }

    // Send email
    if (sendPasswordReset) {
      await sendPasswordReset({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresMinutes: 60,
      });
    }

    logger.info(`Password reset requested for ${email}`);
    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (e) {
    logger.error('Password reset request error:', e);
    res.status(500).json({ error: 'Failed to process reset request' });
  }
});

// Validate reset token (check if it's valid before showing form)
router.get('/validate/:token', async (req, res) => {
  try {
    const result = await query(
      `SELECT pr.*, u.email, u.name FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token=$1 AND pr.used=false AND pr.expires_at > NOW()`,
      [req.params.token]
    );
    if (!result.rows.length) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired reset link' });
    }
    res.json({ valid: true, email: result.rows[0].email, name: result.rows[0].name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reset password with token
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const result = await query(
      `SELECT pr.*, u.email, u.name FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token=$1 AND pr.used=false AND pr.expires_at > NOW()`,
      [token]
    );
    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }
    const row = result.rows[0];

    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, row.user_id]);
    await query('UPDATE password_resets SET used=true WHERE id=$1', [row.id]);

    logger.info(`Password reset completed for ${row.email}`);
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
