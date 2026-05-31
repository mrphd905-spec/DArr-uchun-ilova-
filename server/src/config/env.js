import dotenv from 'dotenv';
dotenv.config();

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    console.warn(`[env] OGOHLANTIRISH: ${name} belgilanmagan`);
  }
  return v;
}

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),

  databaseUrl: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/dreamart'),
  pgSsl: process.env.PGSSL === 'true',

  jwtSecret: required('JWT_SECRET', 'dev_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    username: process.env.TELEGRAM_BOT_USERNAME || '',
  },
  eskiz: {
    email: process.env.ESKIZ_EMAIL || '',
    password: process.env.ESKIZ_PASSWORD || '',
    baseUrl: process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api',
    sender: process.env.ESKIZ_SENDER || '4546',
  },
};
