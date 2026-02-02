import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Detect if SSL is required (Neon) — fallback to local
const useSSL = process.env.DB_SSL === 'true' || process.env.DB_SSL_MODE === 'require';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'setu_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',

  max: 10, // Reduce max connections to avoid overloading free tier
  idleTimeoutMillis: 10000, // Close idle clients faster (10s)
  connectionTimeoutMillis: 60000, // Allow longer initial connection time (60s)
  allowExitOnIdle: false, // Keep event loop alive

  // Enable SSL only when needed (Neon)
  ssl: useSSL
    ? {
      rejectUnauthorized: false,
      keepAlive: true, // IMPORTANT: Keep TCP connection alive
      keepAliveInitialDelayMillis: 10000 // Send keepalive packet after 10s
    }
    : false,
});

// Log connection result
pool.on('connect', () => {
  console.log(
    `✅ Connected to PostgreSQL database ${useSSL ? '(Neon + SSL)' : '(Local)'
    }`
  );
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getClient = () => pool.connect();

export default pool;
