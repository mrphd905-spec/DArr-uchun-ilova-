# DreamArt Rental

Texnika ijarasi (rental) boshqaruv tizimi — admin panel, mijoz mini-app va masshtablanadigan backend.

## 📁 Loyiha tuzilishi (monorepo)

```
DArr-uchun-ilova-/
├── web-admin/        # Admin panel (HTML demo) — index.html
├── client-app/       # Mijoz mini-app (Telegram Mini App namunasi) — index.html
└── server/           # Backend API (Node.js + Express + PostgreSQL)
    └── src/
        ├── config/        # env, db (pg Pool)
        ├── db/            # schema.sql, migrate.js, seed.js
        ├── middlewares/   # auth (JWT), role (admin/gost), error
        ├── modules/       # HAR BIR SAHIFA — alohida modul
        │   ├── auth/      # login, JWT
        │   ├── clients/   # mijozlar (model + service + controller + routes)
        │   ├── devices/   # texnika: kategoriya→guruh→qurilma
        │   ├── rentals/   # ijara berish, uzaytirish, qabul
        │   ├── bookings/  # bron (admin + bot)
        │   ├── reports/   # hisobot (faqat admin)
        │   └── workers/   # ishchilar (faqat admin)
        ├── integrations/  # telegram bot, eskiz sms, notify (dual)
        └── utils/         # jwt
```

> Har bir "sahifa" alohida modulga ajratilgan: **routes → controller → service → model**. Bu kodni toza saqlaydi va jamoa bilan ishlashni osonlashtiradi.

## 🚀 Masshtablanish (100k+ mijoz)

- **PostgreSQL** — millionlab qatorni ko'taradi
- **Indekslar** — qidiruv uchun `pg_trgm` (GIN), qora ro'yxat uchun partial index, hisobot uchun `date`/`pay` indekslari
- **Pagination** — ro'yxatlar `page` + `limit` bilan (bir martada hammasi emas)
- **Connection pool** — ulanishlar qayta ishlatiladi
- **Tranzaksiyalar** — ijara/qabul `withTransaction` + `FOR UPDATE` (ombor sonini xato hisoblamaslik uchun)

## ⚙️ Ishga tushirish (backend)

> Talab: Node.js 18+ va PostgreSQL 14+

```bash
cd server
cp .env.example .env          # .env ni to'ldiring (DATABASE_URL, JWT_SECRET ...)
npm install
npm run migrate               # jadvallarni yaratadi (schema.sql)
npm run seed                  # namunaviy ma'lumot (admin/admin, ishchi/123)
npm run dev                   # http://localhost:4000
```

Tekshirish: `GET http://localhost:4000/health`

## 🔌 Asosiy API (v1)

| Metod | Endpoint | Izoh |
|---|---|---|
| POST | `/api/v1/auth/login` | login → JWT |
| GET | `/api/v1/clients?q=&page=&limit=` | mijozlar (qidiruv + sahifalash) |
| POST | `/api/v1/clients` | yangi mijoz |
| POST | `/api/v1/clients/:id/check-telegram` | TG tekshiruvi |
| POST | `/api/v1/clients/:id/blacklist` | qora ro'yxat (admin) |
| GET | `/api/v1/devices` | texnika daraxti |
| POST | `/api/v1/devices/categories \| groups \| /` | kategoriya/guruh/qurilma qo'shish |
| GET/POST | `/api/v1/rentals` | faol ijaralar / ijara berish |
| POST | `/api/v1/rentals/:id/extend \| accept` | uzaytirish / qabul |
| GET/POST | `/api/v1/bookings` | bron |
| GET | `/api/v1/reports/summary?period=day` | hisobot (admin) |
| GET/POST | `/api/v1/workers` | ishchilar (admin) |

> 🔐 Barcha endpointlar `Authorization: Bearer <token>` talab qiladi. `admin`/`gost` rollari `role` middleware bilan ajratilgan.

## 🔔 Bildirishnomalar (Telegram + SMS)

- **Telegram (bepul):** mijoz botni "Start" qilib, kontaktini ulashgach (`tg_chat_id`) xabar yuboriladi
- **SMS (pullik, Eskiz.uz):** Telegram bo'lmasa fallback. Sender va shablon operator tomonidan tasdiqlanishi shart
- `integrations/notify.service.js` — avval Telegram, bo'lmasa SMS

## 🧩 Frontend
Hozir `web-admin` va `client-app` — bitta HTML demo (localStorage). Keyingi qadam: ularni backend API'ga ulash (`fetch` orqali) va sahifalarni alohida fayllarga bo'lish.

## Holat
- [x] Backend skeleti (modulli)
- [x] PostgreSQL schema + indekslar
- [x] Auth, mijozlar, texnika, ijara, bron, hisobot, ishchilar
- [x] Telegram bot + Eskiz SMS skeletlari
- [ ] Frontendni API'ga ulash
- [ ] Botda to'liq bron oqimi
- [ ] Avtomatik eslatmalar (cron)
