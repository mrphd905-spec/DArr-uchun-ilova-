-- ============================================================
-- DreamArt Rental — PostgreSQL schema
-- 100k+ mijoz uchun indekslar bilan
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;        -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;          -- tezkor matnli qidiruv (ILIKE)

-- ---------- Sozlamalar (kurs va h.k.) ----------
CREATE TABLE IF NOT EXISTS settings (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Xodimlar (admin / gost) ----------
CREATE TABLE IF NOT EXISTS workers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  login        TEXT NOT NULL UNIQUE,
  pass_hash    TEXT NOT NULL,
  phone        TEXT,
  role         TEXT NOT NULL DEFAULT 'gost' CHECK (role IN ('admin','gost')),
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Mijozlar ----------
CREATE TABLE IF NOT EXISTS clients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT UNIQUE,                       -- MJ-001 ko'rinishidagi inson o'qiydigan kod
  ism            TEXT NOT NULL,
  familiya       TEXT NOT NULL,
  otasi          TEXT,
  jinsi          TEXT CHECK (jinsi IN ('erkak','ayol') OR jinsi IS NULL),
  tugilgan_sana  DATE,
  jshshir        TEXT,
  -- passport
  pass_bor       BOOLEAN NOT NULL DEFAULT true,
  pass_turi      TEXT,                              -- ID karta / Pasport / Zagran ...
  pass_serial    TEXT,                              -- AB1234567
  pass_joy       TEXT NOT NULL DEFAULT 'ozida' CHECK (pass_joy IN ('ozida','ofisda')),
  pass_izoh      TEXT,
  -- telegram
  tg_handle      TEXT,
  tg_chat_id     BIGINT,                            -- bot bilan bog'langanda to'ladi
  tg_checked     BOOLEAN NOT NULL DEFAULT false,
  tg_exists      BOOLEAN NOT NULL DEFAULT false,
  -- holat
  taklif         TEXT,                              -- taklif qilgan odam
  photo_url      TEXT,
  photo_date     DATE,
  details        TEXT,
  blacklist      BOOLEAN NOT NULL DEFAULT false,
  discount       INT NOT NULL DEFAULT 0 CHECK (discount BETWEEN 0 AND 100),
  qarzi          BIGINT NOT NULL DEFAULT 0,
  last_rental    DATE,
  status         TEXT NOT NULL DEFAULT 'pending'    -- mijoz o'zi ro'yxatdan o'tsa
                  CHECK (status IN ('pending','active','inactive','blacklist')),
  created_by     UUID REFERENCES workers(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Qidiruv va filtrlash indekslari (100k+ uchun zarur)
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm   ON clients USING gin ((familiya || ' ' || ism) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_serial      ON clients (pass_serial);
CREATE INDEX IF NOT EXISTS idx_clients_blacklist   ON clients (blacklist) WHERE blacklist = true;
CREATE INDEX IF NOT EXISTS idx_clients_status      ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_last_rental ON clients (last_rental);

-- ---------- Mijoz telefonlari ----------
CREATE TABLE IF NOT EXISTS client_phones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type         TEXT NOT NULL DEFAULT 'Ozi',
  number       TEXT NOT NULL,
  is_kafil     BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_phones_client ON client_phones (client_id);
CREATE INDEX IF NOT EXISTS idx_phones_number ON client_phones (number);

-- ---------- Texnika: kategoriya -> guruh -> qurilma ----------
CREATE TABLE IF NOT EXISTS categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ico          TEXT DEFAULT '📦',
  name_uz      TEXT NOT NULL,
  name_ru      TEXT,
  color        TEXT DEFAULT '#3b82f6',
  sort_order   INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  ico          TEXT DEFAULT '🗂',
  name_uz      TEXT NOT NULL,
  name_ru      TEXT
);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups (category_id);

CREATE TABLE IF NOT EXISTS devices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE,                         -- DA-111
  group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  ico          TEXT DEFAULT '🔧',
  name         TEXT NOT NULL,
  price        BIGINT NOT NULL DEFAULT 0,           -- smena narxi
  total        INT NOT NULL DEFAULT 1,
  rented       INT NOT NULL DEFAULT 0,
  booked       INT NOT NULL DEFAULT 0,
  broken       INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_devices_group ON devices (group_id);
CREATE INDEX IF NOT EXISTS idx_devices_name_trgm ON devices USING gin (name gin_trgm_ops);

-- ---------- Ijaralar ----------
CREATE TABLE IF NOT EXISTS rentals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE,                         -- R-1042
  device_id    UUID NOT NULL REFERENCES devices(id),
  device_name  TEXT NOT NULL,
  price        BIGINT NOT NULL,
  days         INT NOT NULL DEFAULT 1,
  date_out     DATE NOT NULL,
  date_in      DATE NOT NULL,
  time_out     TEXT,
  time_in      TEXT,
  pay          TEXT,                                -- naxt/karta/otkazma/qarz
  avans        BIGINT NOT NULL DEFAULT 0,
  total        BIGINT NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','returned','overdue')),
  created_by   UUID REFERENCES workers(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals (status);
CREATE INDEX IF NOT EXISTS idx_rentals_dates  ON rentals (date_out, date_in);

-- Bitta ijarada bir nechta mijoz bo'lishi mumkin (M:N)
CREATE TABLE IF NOT EXISTS rental_clients (
  rental_id    UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  PRIMARY KEY (rental_id, client_id)
);
CREATE INDEX IF NOT EXISTS idx_rc_client ON rental_clients (client_id);

-- ---------- Bronlar ----------
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE,
  client_id    UUID REFERENCES clients(id),
  client_name  TEXT,
  device_id    UUID REFERENCES devices(id),
  device_name  TEXT,
  date_out     DATE NOT NULL,
  date_in      DATE NOT NULL,
  time_out     TEXT,
  time_in      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  source       TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin','bot')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates  ON bookings (date_out);

-- ---------- Buzilgan / yo'qotilgan ----------
CREATE TABLE IF NOT EXISTS damages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  device_name  TEXT,
  amount       BIGINT NOT NULL DEFAULT 0,
  holat        TEXT,                                -- yengil / jiddiy / yo'qolgan
  note         TEXT,
  date         DATE NOT NULL DEFAULT current_date
);
CREATE INDEX IF NOT EXISTS idx_damages_client ON damages (client_id);

-- ---------- Moliyaviy tranzaksiyalar (hisobot uchun) ----------
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL DEFAULT current_date,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name  TEXT,
  kind         TEXT NOT NULL,                       -- avans/ijara/jarima
  pay          TEXT NOT NULL,                       -- naxt/karta/otkazma/qarz
  amount       BIGINT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Hisobot davr bo'yicha tez agregatsiya uchun
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_txn_pay  ON transactions (pay);

-- ---------- Chat xabarlari (admin <-> ishchi) ----------
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id    UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  from_role    TEXT NOT NULL CHECK (from_role IN ('admin','worker')),
  text         TEXT NOT NULL,
  seen         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_worker ON messages (worker_id, created_at);
