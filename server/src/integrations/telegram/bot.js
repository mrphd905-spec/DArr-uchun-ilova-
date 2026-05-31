import { Telegraf, Markup } from 'telegraf';
import { env } from '../../config/env.js';
import { query } from '../../config/db.js';

// Telegram bot — token bo'lmasa ishga tushmaydi (ogohlantirib o'tib ketadi).
let bot = null;

export async function startBot() {
  if (!env.telegram.token) {
    console.log('[bot] TELEGRAM_BOT_TOKEN yo\'q — bot o\'chirilgan');
    return;
  }
  bot = new Telegraf(env.telegram.token);

  // /start — kontakt so'rash (mijozni telefon orqali bog'lash)
  bot.start((ctx) =>
    ctx.reply(
      'Assalomu alaykum! DreamArt Rental botiga xush kelibsiz.\n' +
      'Bron qilish uchun telefon raqamingizni ulashing 👇',
      Markup.keyboard([Markup.button.contactRequest('📲 Kontaktni ulashish')]).resize()
    )
  );

  // Mijoz kontaktni ulashganda — chat_id + telefonni saqlaymiz
  bot.on('contact', async (ctx) => {
    const phone = ctx.message.contact.phone_number;
    const chatId = ctx.from.id;
    const username = ctx.from.username ? '@' + ctx.from.username : null;
    try {
      // Telefon raqami bo'yicha mijozni topib, tg_chat_id ni bog'laymiz
      await query(
        `UPDATE clients SET tg_chat_id=$1, tg_handle=COALESCE(tg_handle,$2), tg_checked=true, tg_exists=true
         WHERE id IN (SELECT client_id FROM client_phones WHERE replace(number,' ','') LIKE '%' || right(replace($3,' ',''),7))`,
        [chatId, username, phone]
      );
    } catch (e) {
      console.error('[bot] contact saqlashda xato:', e.message);
    }
    ctx.reply('Rahmat! Raqamingiz qabul qilindi ✅\nEndi /bron buyrug\'i orqali texnika band qilishingiz mumkin.');
  });

  // /bron — TODO: bron oqimini (texnika -> sana -> tasdiq) shu yerda quramiz
  bot.command('bron', (ctx) =>
    ctx.reply('Bron bo\'limi tez orada qo\'shiladi. Hozircha operatorga murojaat qiling.')
  );

  bot.launch().then(() => console.log('[bot] Telegram bot ishga tushdi'));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

/**
 * Mijozga Telegram orqali xabar yuborish.
 * Faqat mijoz botni "Start" qilgan bo'lsa (tg_chat_id bor) ishlaydi.
 * @returns {boolean} yuborildimi
 */
export async function sendTelegram(chatId, text) {
  if (!bot || !chatId) return false;
  try {
    await bot.telegram.sendMessage(chatId, text);
    return true;
  } catch (e) {
    console.error('[bot] sendMessage xato:', e.message);
    return false;
  }
}
