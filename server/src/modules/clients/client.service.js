import { ClientModel } from './client.model.js';
import { ApiError } from '../../middlewares/error.js';

// Biznes-mantiq: validatsiya, hisoblangan maydonlar, Telegram tekshiruvi.
export class ClientService {
  static async list(params) {
    const limit = Math.min(parseInt(params.limit || '50', 10), 200);
    const page = Math.max(parseInt(params.page || '1', 10), 1);
    const offset = (page - 1) * limit;
    const blacklist = params.blacklist === 'true' ? true
      : params.blacklist === 'false' ? false : undefined;

    const { total, rows } = await ClientModel.list({
      q: params.q || '', status: params.status, blacklist, limit, offset,
    });
    return { total, page, limit, items: rows.map(withComputed) };
  }

  static async get(id) {
    const c = await ClientModel.findById(id);
    if (!c) throw ApiError.notFound('Mijoz topilmadi');
    return withComputed(c);
  }

  static async create(body, user) {
    if (!body.ism || !body.familiya) throw ApiError.badRequest('Ism va familiya majburiy');
    if (body.pass_bor && body.pass_serial && !/^[A-Z]{2}\d{7}$/.test(body.pass_serial)) {
      throw ApiError.badRequest('Pasport seriyasi noto\'g\'ri (AB1234567)');
    }
    body.created_by = user?.id || null;
    const phones = body.phones || [];
    return withComputed(await ClientModel.create(body, phones));
  }

  static async update(id, body) {
    const c = await ClientModel.update(id, body);
    if (!c) throw ApiError.notFound('Mijoz topilmadi');
    return withComputed(c);
  }

  // Telegram tekshiruvi: real holatda TelegramService bilan almashtiriladi
  static async checkTelegram(id, handle) {
    const exists = mockTgCheck(handle);
    const c = await ClientModel.update(id, { tg_handle: handle, tg_checked: true, tg_exists: exists });
    return withComputed(c);
  }

  static async toggleBlacklist(id, value) {
    const c = await ClientModel.setBlacklist(id, value);
    if (!c) throw ApiError.notFound('Mijoz topilmadi');
    return withComputed(c);
  }

  static blacklist() { return ClientModel.listBlacklist().then((r) => r.map(withComputed)); }
}

// Hisoblangan maydonlar: 2 oydan oshsa "noaktiv", rasm 6 oydan eski bo'lsa belgilanadi
function withComputed(c) {
  const monthsSince = (d) => d ? (Date.now() - new Date(d)) / (30 * 86400000) : 999;
  let computedStatus = c.status;
  if (c.blacklist) computedStatus = 'blacklist';
  else if (monthsSince(c.last_rental) > 2) computedStatus = 'inactive';
  else computedStatus = 'active';
  return {
    ...c,
    full_name: `${c.familiya} ${c.ism}`,
    computed_status: computedStatus,
    photo_outdated: c.photo_date ? monthsSince(c.photo_date) > 6 : false,
  };
}

function mockTgCheck(handle) {
  if (!handle) return false;
  let h = 0;
  for (const ch of handle) h += ch.charCodeAt(0);
  return h % 4 !== 0;
}
