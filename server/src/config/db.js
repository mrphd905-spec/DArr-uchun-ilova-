import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// Bitta umumiy ulanishlar havzasi (connection pool).
// 100k+ mijoz va ko'p so'rovlar uchun pool muhim: har bir so'rovga
// yangi ulanish ochilmaydi, balki havzadan qayta ishlatiladi.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl ? { rejectUnauthorized: false } : false,
  max: 20, // bir vaqtdagi maksimal ulanishlar
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[db] kutilmagan pool xatosi:', err.message);
});

/**
 * Qisqa so'rov yordamchisi.
 * @param {string} text SQL
 * @param {Array} params parametrlar ($1, $2, ...)
 */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Tranzaksiya ichida bir nechta so'rovni bajarish.
 * @param {(client: pg.PoolClient) => Promise<any>} fn
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
