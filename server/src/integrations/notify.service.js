import { sendTelegram } from './telegram/bot.js';
import { sendSms } from './sms/eskiz.service.js';

/**
 * Aqlli eslatma: avval Telegram (bepul), bo'lmasa SMS (pullik) fallback.
 * @param {{tg_chat_id?:number, phone?:string}} client
 * @param {string} text
 * @returns {Promise<'telegram'|'sms'|'none'>}
 */
export async function notifyClient(client, text) {
  if (client?.tg_chat_id) {
    const ok = await sendTelegram(client.tg_chat_id, text);
    if (ok) return 'telegram';
  }
  if (client?.phone) {
    try {
      await sendSms(client.phone, text);
      return 'sms';
    } catch (e) {
      console.error('[notify] SMS xato:', e.message);
    }
  }
  return 'none';
}
