// Namunaviy ma'lumotlar: `npm run seed`
// admin + 2 ishchi, 3 mijoz, 2 kategoriya / 3 texnika, kurs.
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../config/db.js';

async function seed() {
  await withTransaction(async (c) => {
    // Kurs
    await c.query(
      `INSERT INTO settings(key,value) VALUES('rate','12700')
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`
    );

    // Admin + ishchilar
    const adminHash = await bcrypt.hash('admin', 10);
    const gostHash = await bcrypt.hash('123', 10);
    await c.query(
      `INSERT INTO workers(name,login,pass_hash,role) VALUES
        ('Admin','admin',$1,'admin'),
        ('Aliyev Sardor','ishchi',$2,'gost'),
        ('Karimov Bekzod','bek',$2,'gost')
       ON CONFLICT (login) DO NOTHING`,
      [adminHash, gostHash]
    );

    // Mijozlar (3 ta namuna)
    const clients = [
      ['MJ-001', 'Javohir', 'Qudratov', 'ID karta', 'AB1234567', 'ofisda', '@javohir_q', false, 5, 0, '2026-05-25', 'active'],
      ['MJ-002', 'Dilnoza', 'Karimova', 'Prava', 'CD3456789', 'ozida', null, false, 0, 50000, '2026-02-15', 'inactive'],
      ['MJ-003', 'Sardor', 'Ismoilov', null, null, 'ozida', '@sardor_i', true, 0, 120000, '2026-05-28', 'blacklist'],
    ];
    for (const [code, ism, fam, ptur, pser, pjoy, tg, blk, disc, qarz, last, st] of clients) {
      const r = await c.query(
        `INSERT INTO clients(code,ism,familiya,pass_bor,pass_turi,pass_serial,pass_joy,tg_handle,blacklist,discount,qarzi,last_rental,status)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (code) DO NOTHING RETURNING id`,
        [code, ism, fam, !!ptur, ptur, pser, pjoy, tg, blk, disc, qarz, last, st]
      );
      if (r.rows[0]) {
        await c.query(
          `INSERT INTO client_phones(client_id,type,number,is_kafil) VALUES($1,'Ozi','90 000 00 00',false)`,
          [r.rows[0].id]
        );
      }
    }

    // Texnika: 2 kategoriya, 3 qurilma
    const cat1 = (await c.query(
      `INSERT INTO categories(ico,name_uz,name_ru,color) VALUES('📷','Foto texnika','Фото техника','#3b82f6') RETURNING id`
    )).rows[0].id;
    const cat2 = (await c.query(
      `INSERT INTO categories(ico,name_uz,name_ru,color) VALUES('⚡','Qurilish texnikasi','Строительная','#ef4444') RETURNING id`
    )).rows[0].id;

    const g1 = (await c.query(
      `INSERT INTO groups(category_id,ico,name_uz,name_ru) VALUES($1,'📸','Kameralar','Камеры') RETURNING id`, [cat1]
    )).rows[0].id;
    const g2 = (await c.query(
      `INSERT INTO groups(category_id,ico,name_uz,name_ru) VALUES($1,'⚡','Generatorlar','Генераторы') RETURNING id`, [cat2]
    )).rows[0].id;

    await c.query(
      `INSERT INTO devices(code,group_id,ico,name,price,total,rented) VALUES
        ('DA-111',$1,'📷','Canon EOS 5D Mark IV',150000,5,1),
        ('DA-112',$1,'📷','Sony A7 III',120000,3,0),
        ('DA-511',$2,'⚡','Generator Honda 3kW',90000,10,0)`,
      [g1, g2]
    );
  });

  console.log('[seed] Namunaviy ma\'lumotlar qo\'shildi ✔ (admin/admin, ishchi/123)');
  await pool.end();
}

seed().catch((e) => {
  console.error('[seed] xato:', e.message);
  process.exit(1);
});
