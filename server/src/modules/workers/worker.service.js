import bcrypt from 'bcryptjs';
import { query } from '../../config/db.js';
import { ApiError } from '../../middlewares/error.js';

export class WorkerService {
  static async list() {
    return (await query(
      `SELECT id,name,login,phone,role,active,created_at FROM workers ORDER BY created_at`
    )).rows;
  }

  static async create(b) {
    if (!b.name || !b.login || !b.password) throw ApiError.badRequest('Ism, login va parol kerak');
    const exists = (await query(`SELECT 1 FROM workers WHERE login=$1`, [b.login])).rows[0];
    if (exists) throw ApiError.badRequest('Bu login band');
    const hash = await bcrypt.hash(b.password, 10);
    return (await query(
      `INSERT INTO workers(name,login,pass_hash,phone,role) VALUES($1,$2,$3,$4,$5)
       RETURNING id,name,login,phone,role,active`,
      [b.name, b.login, hash, b.phone || null, b.role === 'admin' ? 'admin' : 'gost']
    )).rows[0];
  }

  static async update(id, b) {
    const sets = [], params = [];
    let i = 1;
    if (b.name) { sets.push(`name=$${i++}`); params.push(b.name); }
    if (b.phone !== undefined) { sets.push(`phone=$${i++}`); params.push(b.phone); }
    if (b.active !== undefined) { sets.push(`active=$${i++}`); params.push(!!b.active); }
    if (b.password) { sets.push(`pass_hash=$${i++}`); params.push(await bcrypt.hash(b.password, 10)); }
    if (!sets.length) throw ApiError.badRequest('Yangilanadigan maydon yo\'q');
    params.push(id);
    const r = await query(
      `UPDATE workers SET ${sets.join(', ')} WHERE id=$${i} RETURNING id,name,login,phone,role,active`, params
    );
    if (!r.rows[0]) throw ApiError.notFound('Ishchi topilmadi');
    return r.rows[0];
  }

  static async remove(id) {
    await query(`DELETE FROM workers WHERE id=$1 AND role <> 'admin'`, [id]);
    return { ok: true };
  }
}
