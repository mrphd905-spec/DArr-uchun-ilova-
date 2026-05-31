import { query } from '../../config/db.js';

export class ReportService {
  // period: day | month | year | custom (from,to)
  static async summary({ period = 'day', from, to }) {
    let cond = `date = current_date`;
    const params = [];
    if (period === 'month') cond = `date_trunc('month', date) = date_trunc('month', current_date)`;
    else if (period === 'year') cond = `date_trunc('year', date) = date_trunc('year', current_date)`;
    else if (period === 'custom' && from && to) { cond = `date BETWEEN $1 AND $2`; params.push(from, to); }

    const byPay = (await query(
      `SELECT pay, COALESCE(sum(amount),0)::bigint AS total FROM transactions WHERE ${cond} GROUP BY pay`,
      params
    )).rows;

    const map = { naxt: 0, karta: 0, otkazma: 0, qarz: 0 };
    for (const r of byPay) map[r.pay] = Number(r.total);
    const income = map.naxt + map.karta + map.otkazma;

    const txns = (await query(
      `SELECT date, client_name, kind, pay, amount FROM transactions WHERE ${cond} ORDER BY created_at DESC LIMIT 200`,
      params
    )).rows;

    return { period, total: income, naxt: map.naxt, karta: map.karta, otkazma: map.otkazma, qarz: map.qarz, transactions: txns };
  }
}
