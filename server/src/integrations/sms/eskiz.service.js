import { env } from '../../config/env.js';

// Eskiz.uz SMS integratsiyasi (Node 18+ ichida fetch mavjud).
// Hujjat: https://documenter.getpostman.com/view/663428/RzfmES4z
let token = null;
let tokenAt = 0;

async function getToken() {
  // token ~30 kun yashaydi; biz har 24 soatda yangilaymiz
  if (token && Date.now() - tokenAt < 24 * 3600 * 1000) return token;
  if (!env.eskiz.email || !env.eskiz.password) {
    throw new Error('ESKIZ_EMAIL / ESKIZ_PASSWORD belgilanmagan');
  }
  const res = await fetch(`${env.eskiz.baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.eskiz.email, password: env.eskiz.password }),
  });
  const data = await res.json();
  token = data?.data?.token;
  tokenAt = Date.now();
  if (!token) throw new Error('Eskiz token olinmadi');
  return token;
}

/**
 * SMS yuborish.
 * DIQQAT: matn (shablon) va sender Eskiz/operator tomonidan tasdiqlangan bo'lishi shart.
 * @param {string} phone 998901234567 ko'rinishida
 * @param {string} message tasdiqlangan shablon matni
 */
export async function sendSms(phone, message) {
  const t = await getToken();
  const body = new URLSearchParams({
    mobile_phone: phone.replace(/\D/g, ''),
    message,
    from: env.eskiz.sender,
  });
  const res = await fetch(`${env.eskiz.baseUrl}/message/sms/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}` },
    body,
  });
  return res.json();
}
