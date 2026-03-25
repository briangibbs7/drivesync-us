import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { pool, initDB } from './db.js';
import { logger } from './logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import fileRoutes from './routes/files.js';
import spaceRoutes from './routes/spaces.js';
import projectRoutes from './routes/projects.js';
import shareRoutes from './routes/shares.js';
import serverRoutes from './routes/servers.js';
import portalRoutes from './routes/portals.js';
import activityRoutes from './routes/activity.js';
import adminRoutes from './routes/admin.js';
import passwordResetRoutes from './routes/password-reset.js';
import portalPublicRoutes from './routes/portal-public.js';
import drivesRoutes from './routes/drives.js';
import passwordRoutes from './routes/password.js';
import inviteRoutes from './routes/invite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

// ─── Middleware ──────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});
app.use('/api/auth/login', authLimiter);

// ─── API Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/portals', portalRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/portal', portalPublicRoutes);
app.use('/api/drives', drivesRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/invite', inviteRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', time: new Date().toISOString(), version: '1.0.0' });
  } catch (e) {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

// ─── Error handler ──────────────────────────────────────────────────────

// Public region info
app.get('/api/region', (req, res) => {
  const region = process.env.REGION || 'us';
  const regions = {
    us: { id: 'us', name: 'United States', flag: '🇺🇸', short: 'US', color: '#3B82F6' },
    asia: { id: 'asia', name: 'Asia', flag: '🇯🇵', short: 'ASIA', color: '#EF4444' },
  };
  res.json(regions[region] || regions.us);
});

app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

// ─── Start ──────────────────────────────────────────────────────────────
async function start() {
  await initDB();
  app.listen(PORT, '127.0.0.1', () => {
    logger.info(`DriveSync API running on port ${PORT}`);
  });
}

start().catch((e) => {
  logger.error('Failed to start server:', e);
  process.exit(1);
});
