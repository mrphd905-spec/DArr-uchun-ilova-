import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { startBot } from './integrations/telegram/bot.js';

async function main() {
  const app = createApp();

  // DB ulanishini tekshirish
  try {
    await pool.query('SELECT 1');
    console.log('[db] PostgreSQL ulanishi muvaffaqiyatli');
  } catch (e) {
    console.error('[db] ulanib bo\'lmadi:', e.message);
  }

  // Telegram bot (token bo'lsa ishga tushadi)
  startBot().catch((e) => console.error('[bot] xato:', e.message));

  app.listen(env.port, () => {
    console.log(`[server] http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

main();
