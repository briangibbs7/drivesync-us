import pg from 'pg';
import { logger } from './logger.js';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PG pool error:', err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    logger.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}`);
  }
  return res;
}

export async function initDB() {
  try {
    const res = await pool.query('SELECT NOW()');
    logger.info(`Database connected: ${res.rows[0].now}`);
  } catch (e) {
    logger.error('Database connection failed:', e.message);
    throw e;
  }
}
