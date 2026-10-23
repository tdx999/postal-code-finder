import { Pool } from 'pg';

// Detect local environment for SSL handling.
const isLocal = process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.includes('localhost') ||
   process.env.DATABASE_URL.includes('127.0.0.1'));

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
};

// Reuse pool in dev to avoid connection storms during hot reload.
const pool = globalThis._dbPool || new Pool(poolConfig);
if (process.env.NODE_ENV !== 'production') {
  globalThis._dbPool = pool;
}

// Connection pool error logging.
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export default pool;