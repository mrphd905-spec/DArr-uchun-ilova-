import { query } from '../../config/db.js';
import { ApiError } from '../../middlewares/error.js';

// Texnika: kategoriya -> guruh -> qurilma daraxti
export class DeviceService {
  // To'liq daraxt (admin panel "Texnikalar" sahifasi uchun)
  static async tree() {
    const cats = (await query(`SELECT * FROM categories ORDER BY sort_order, name_uz`)).rows;
    const groups = (await query(`SELECT * FROM groups`)).rows;
    const devices = (await query(`SELECT * FROM devices ORDER BY name`)).rows;
    return cats.map((c) => ({
      ...c,
      groups: groups.filter((g) => g.category_id === c.id).map((g) => ({
        ...g,
        devices: devices.filter((d) => d.group_id === g.id).map(withAvail),
      })),
    }));
  }

  static async searchDevices(q) {
    const rows = (await query(
      `SELECT * FROM devices WHERE name ILIKE $1 OR code ILIKE $1 ORDER BY name LIMIT 50`,
      [`%${q || ''}%`]
    )).rows;
    return rows.map(withAvail);
  }

  static async addCategory(b) {
    if (!b.name_uz) throw ApiError.badRequest('Kategoriya nomi kerak');
    return (await query(
      `INSERT INTO categories(ico,name_uz,name_ru,color) VALUES($1,$2,$3,$4) RETURNING *`,
      [b.ico || '📦', b.name_uz, b.name_ru || b.name_uz, b.color || '#3b82f6']
    )).rows[0];
  }

  static async addGroup(b) {
    if (!b.category_id || !b.name_uz) throw ApiError.badRequest('Kategoriya va guruh nomi kerak');
    return (await query(
      `INSERT INTO groups(category_id,ico,name_uz,name_ru) VALUES($1,$2,$3,$4) RETURNING *`,
      [b.category_id, b.ico || '🗂', b.name_uz, b.name_ru || b.name_uz]
    )).rows[0];
  }

  static async addDevice(b) {
    if (!b.group_id || !b.name || !b.price) throw ApiError.badRequest('Guruh, nom va narx kerak');
    const code = b.code || ('DA-' + Date.now().toString().slice(-4));
    return withAvail((await query(
      `INSERT INTO devices(code,group_id,ico,name,price,total) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [code, b.group_id, b.ico || '🔧', b.name, b.price, b.total || 1]
    )).rows[0]);
  }
}

// Mavjud (bo'sh) soni = total - rented - booked - broken
function withAvail(d) {
  return { ...d, available: Math.max(0, d.total - d.rented - d.booked - d.broken) };
}
