import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../middlewares/error.js';

export class RentalService {
  static async listActive() {
    const rentals = (await query(
      `SELECT * FROM rentals WHERE status='active' ORDER BY created_at DESC`
    )).rows;
    // har bir ijaraga mijoz ismlarini biriktiramiz
    for (const r of rentals) {
      r.clients = (await query(
        `SELECT c.id, c.code, c.familiya, c.ism FROM rental_clients rc
         JOIN clients c ON c.id = rc.client_id WHERE rc.rental_id = $1`, [r.id]
      )).rows;
    }
    return rentals;
  }

  // Ijaraga berish: ko'p mijoz + bitta texnika
  static async create(body, user) {
    const { client_ids, device_id, days = 1, date_out, date_in, time_out, time_in, pay = 'naxt', avans = 0 } = body;
    if (!client_ids?.length) throw ApiError.badRequest('Kamida bitta mijoz tanlang');
    if (!device_id) throw ApiError.badRequest('Texnika tanlang');

    return withTransaction(async (c) => {
      const dev = (await c.query(`SELECT * FROM devices WHERE id=$1 FOR UPDATE`, [device_id])).rows[0];
      if (!dev) throw ApiError.notFound('Texnika topilmadi');
      const available = dev.total - dev.rented - dev.booked - dev.broken;
      if (available <= 0) throw ApiError.badRequest('Texnika omborda mavjud emas');

      const total = dev.price * days;
      const code = 'R-' + Math.floor(1000 + Math.random() * 9000);
      const rental = (await c.query(
        `INSERT INTO rentals(code,device_id,device_name,price,days,date_out,date_in,time_out,time_in,pay,avans,total,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [code, dev.id, dev.name, dev.price, days, date_out, date_in, time_out, time_in, pay, avans, total, user?.id || null]
      )).rows[0];

      for (const cid of client_ids) {
        await c.query(`INSERT INTO rental_clients(rental_id,client_id) VALUES($1,$2)`, [rental.id, cid]);
        await c.query(`UPDATE clients SET last_rental=$2, status='active' WHERE id=$1`, [cid, date_out]);
      }
      await c.query(`UPDATE devices SET rented = rented + 1 WHERE id=$1`, [dev.id]);

      if (avans > 0) {
        await c.query(
          `INSERT INTO transactions(client_id,client_name,kind,pay,amount) VALUES($1,$2,'avans',$3,$4)`,
          [client_ids[0], null, pay, avans]
        );
      }
      return rental;
    });
  }

  // Muddatni uzaytirish
  static async extend(id, addDays) {
    addDays = parseInt(addDays, 10) || 1;
    return withTransaction(async (c) => {
      const r = (await c.query(`SELECT * FROM rentals WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!r) throw ApiError.notFound('Ijara topilmadi');
      const newDate = new Date(new Date(r.date_in).getTime() + addDays * 86400000)
        .toISOString().slice(0, 10);
      return (await c.query(
        `UPDATE rentals SET days=days+$2, date_in=$3, total=total+price*$2 WHERE id=$1 RETURNING *`,
        [id, addDays, newDate]
      )).rows[0];
    });
  }

  // Qabul qilish (qaytarish)
  static async accept(id, { pay = 'naxt', jarima = 0, holat = 'g', note = '' }) {
    return withTransaction(async (c) => {
      const r = (await c.query(`SELECT * FROM rentals WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!r) throw ApiError.notFound('Ijara topilmadi');
      if (r.status === 'returned') throw ApiError.badRequest('Allaqachon qabul qilingan');

      await c.query(`UPDATE devices SET rented = GREATEST(rented-1,0) WHERE id=$1`, [r.device_id]);
      if (holat === 'r') await c.query(`UPDATE devices SET broken = broken+1 WHERE id=$1`, [r.device_id]);
      await c.query(`UPDATE rentals SET status='returned' WHERE id=$1`, [id]);

      const tolanadi = Math.max(0, r.total - r.avans);
      const amount = tolanadi + (jarima || 0);

      const firstClient = (await c.query(
        `SELECT client_id FROM rental_clients WHERE rental_id=$1 LIMIT 1`, [id]
      )).rows[0];

      if (jarima > 0 && firstClient) {
        await c.query(
          `INSERT INTO damages(client_id,device_name,amount,holat,note) VALUES($1,$2,$3,$4,$5)`,
          [firstClient.client_id, r.device_name, jarima, holat, note]
        );
      }
      if (pay === 'qarz' && firstClient) {
        await c.query(`UPDATE clients SET qarzi = qarzi + $2 WHERE id=$1`, [firstClient.client_id, amount]);
      }
      await c.query(
        `INSERT INTO transactions(client_id,kind,pay,amount) VALUES($1,$2,$3,$4)`,
        [firstClient?.client_id || null, jarima > 0 ? 'ijara+jarima' : 'ijara', pay, amount]
      );
      return { ok: true, amount };
    });
  }
}
