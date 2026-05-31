// schema.sql ni bazaga qo'llaydi: `npm run migrate`
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('[migrate] schema.sql qo\'llanmoqda...');
  await pool.query(sql);
  console.log('[migrate] Tayyor ✔');
  await pool.end();
}

migrate().catch((e) => {
  console.error('[migrate] xato:', e.message);
  process.exit(1);
});
