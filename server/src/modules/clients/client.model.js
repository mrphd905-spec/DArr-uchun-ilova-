import { query, withTransaction } from '../../config/db.js';

// Repository klass: faqat bazaga murojaat (SQL) shu yerda.
// Biznes-mantiq esa client.service.js da.
export class ClientModel {
  // Sahifalangan ro'yxat + qidiruv (100k+ uchun LIMIT/OFFSET + indeksli ILIKE)
  static async list({ q = '', status, blacklist, limit = 50, offset = 0 }) {
    const where = [];
    const params = [];
    let i = 1;

    if (q) {
      where.push(`((familiya || ' ' || ism) ILIKE $${i} OR pass_serial ILIKE $${i} OR code ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }
    if (status) { where.push(`status = $${i++}`); params.push(status); }
    if (blacklist !== undefined) { where.push(`blacklist = $${i++}`); params.push(blacklist); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRes = await query(`SELECT count(*)::int AS n FROM clients ${whereSql}`, params);
    const rows = (await query(
      `SELECT * FROM clients ${whereSql} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    )).rows;

    return { total: totalRes.rows[0].n, rows };
  }

  static async findById(id) {
    const c = (await query(`SELECT * FROM clients WHERE id = $1`, [id])).rows[0];
    if (!c) return null;
    c.phones = (await query(`SELECT id,type,number,is_kafil FROM client_phones WHERE client_id = $1`, [id])).rows;
    return c;
  }

  static async nextCode() {
    const r = await query(`SELECT count(*)::int AS n FROM clients`);
    return 'MJ-' + String(r.rows[0].n + 1).padStart(3, '0');
  }

  static async create(data, phones = []) {
    return withTransaction(async (c) => {
      const code = data.code || (await this.nextCode());
      const r = await c.query(
        `INSERT INTO clients
          (code,ism,familiya,otasi,jinsi,tugilgan_sana,jshshir,
           pass_bor,pass_turi,pass_serial,pass_joy,pass_izoh,
           tg_handle,taklif,photo_url,photo_date,details,status,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         RETURNING *`,
        [code, data.ism, data.familiya, data.otasi, data.jinsi, data.tugilgan_sana, data.jshshir,
         data.pass_bor ?? true, data.pass_turi, data.pass_serial, data.pass_joy || 'ozida', data.pass_izoh,
         data.tg_handle, data.taklif, data.photo_url, data.photo_date, data.details,
         data.status || 'active', data.created_by || null]
      );
      const client = r.rows[0];
      for (const p of phones) {
        await c.query(
          `INSERT INTO client_phones(client_id,type,number,is_kafil) VALUES($1,$2,$3,$4)`,
          [client.id, p.type || 'Ozi', p.number, !!p.is_kafil]
        );
      }
      return client;
    });
  }

  static async update(id, data) {
    const allowed = ['ism','familiya','otasi','jinsi','tugilgan_sana','jshshir',
      'pass_bor','pass_turi','pass_serial','pass_joy','pass_izoh',
      'tg_handle','tg_chat_id','tg_checked','tg_exists',
      'taklif','photo_url','photo_date','details','blacklist','discount','qarzi','status'];
    const sets = [];
    const params = [];
    let i = 1;
    for (const key of allowed) {
      if (data[key] !== undefined) { sets.push(`${key} = $${i++}`); params.push(data[key]); }
    }
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const r = await query(`UPDATE clients SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return r.rows[0] || null;
  }

  static async setBlacklist(id, value) {
    const r = await query(
      `UPDATE clients SET blacklist=$2, status=CASE WHEN $2 THEN 'blacklist' ELSE 'active' END, updated_at=now()
       WHERE id=$1 RETURNING *`, [id, value]
    );
    return r.rows[0] || null;
  }

  static async listBlacklist() {
    return (await query(`SELECT * FROM clients WHERE blacklist = true ORDER BY updated_at DESC`)).rows;
  }
}
