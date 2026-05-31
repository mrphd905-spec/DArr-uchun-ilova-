import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../middlewares/error.js';

export class BookingService {
  static async list(status) {
    const where = status ? `WHERE status = $1` : '';
    const params = status ? [status] : [];
    return (await query(`SELECT * FROM bookings ${where} ORDER BY date_out`, params)).rows;
  }

  // source: 'admin' yoki 'bot' (mijoz o'zi bron qilsa)
  static async create(body, source = 'admin') {
    const { client_id, client_name, device_id, date_out, date_in, time_out, time_in } = body;
    if (!device_id || !date_out) throw ApiError.badRequest('Texnika va sana kerak');
    return withTransaction(async (c) => {
      const dev = (await c.query(`SELECT * FROM devices WHERE id=$1 FOR UPDATE`, [device_id])).rows[0];
      if (!dev) throw ApiError.notFound('Texnika topilmadi');
      if (dev.total - dev.rented - dev.booked - dev.broken <= 0)
        throw ApiError.badRequest('Omborda mavjud emas');

      const code = 'B-' + Date.now().toString().slice(-5);
      // bot orqali kelsa — pending (admin tasdiqlaydi), admin qo'shsa — confirmed
      const status = source === 'bot' ? 'pending' : 'confirmed';
      const b = (await c.query(
        `INSERT INTO bookings(code,client_id,client_name,device_id,device_name,date_out,date_in,time_out,time_in,status,source)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [code, client_id || null, client_name, dev.id, dev.name, date_out, date_in || date_out, time_out, time_in, status, source]
      )).rows[0];
      if (status === 'confirmed') await c.query(`UPDATE devices SET booked = booked+1 WHERE id=$1`, [dev.id]);
      return b;
    });
  }

  static async setStatus(id, status) {
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) throw ApiError.badRequest('Status xato');
    return withTransaction(async (c) => {
      const b = (await c.query(`SELECT * FROM bookings WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!b) throw ApiError.notFound('Bron topilmadi');
      // band sonini to'g'rilash
      if (b.status !== 'confirmed' && status === 'confirmed')
        await c.query(`UPDATE devices SET booked = booked+1 WHERE id=$1`, [b.device_id]);
      if (b.status === 'confirmed' && status !== 'confirmed')
        await c.query(`UPDATE devices SET booked = GREATEST(booked-1,0) WHERE id=$1`, [b.device_id]);
      return (await c.query(`UPDATE bookings SET status=$2 WHERE id=$1 RETURNING *`, [id, status])).rows[0];
    });
  }
}
