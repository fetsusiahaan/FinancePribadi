# Prosedur Failover Database

## Kenapa bentuknya begini

Pertanyaan awalnya: bisakah dua database dijadikan load balance supaya anti-down?

**Tidak bisa** untuk aplikasi ini, dan alasannya bukan soal effort:

1. **Split-brain.** Neon dan Supabase tidak punya replikasi lintas provider. Dua database yang sama-sama menerima INSERT akan langsung bercabang — user yang daftar di DB-A tidak ada di DB-B.
2. **Invariant hanya berlaku per-database.** `uq_shared_finance_single_active_owner` (partial unique index, ditulis tangan di `prisma/migrations/20260829091304_add_shared_finance/migration.sql`) menjamin "tepat satu OWNER aktif per ruang" — tapi hanya di dalam satu Postgres. Dua database = bisa dua owner sekaligus, tanpa error.
3. **Transaksi interaktif tidak bisa lintas database.** `sharedFinance.service.js:48`, `sharedFinance.service.js:141` (alih kepemilikan), dan `sharedFinanceInvitation.service.js:175` memakai `prisma.$transaction` dengan callback. Tidak ada 2PC di Prisma.

Yang realistis untuk satu proses Node di free tier adalah **failover manual yang cepat dan terlatih**: satu database aktif, satu standby dingin yang diisi backup terjadwal.

**Harga yang harus diterima:** tidak ada replikasi, jadi failover berarti kehilangan data yang masuk setelah dump terakhir. Frekuensi backup = batas atas kehilangan data.

## Kenapa bukan load balancing (PgBouncer, HAProxy, read replica)

Pertanyaan ini muncul tiga kali dengan bentuk berbeda: "dua DB bisa di-load balance?", "dua slot Supabase bisa?", "dengan PgBouncer?". Jawabannya dicatat di sini supaya tidak perlu diteliti ulang dari nol.

### 1. PgBouncer/Supavisor: connection pooling ≠ load balancing

Kata `pooler` di `aws-0-ap-northeast-2.pooler.supabase.com` adalah sumber kebingungan yang paling mungkin. Yang di-*pool* di situ adalah **koneksi ke satu database** — banyak klien berbagi sedikit koneksi backend. Bukan pembagian trafik ke beberapa database.

FAQ PgBouncer sendiri:

> *"does not have an internal multi-host configuration"*
>
> *"does not have internal failover-host configuration nor detection"*

Untuk load balancing ia menyuruh pakai DNS round-robin, LVS, atau HAProxy — semuanya **di luar** PgBouncer. Halaman fiturnya tidak menyebut load balancing, read/write splitting, maupun routing ke replika; yang ada cuma tiga mode pooling (session/transaction/statement).

Dan Supabase sudah tidak memakai PgBouncer lagi, melainkan **Supavisor**. Jadi pertanyaannya bahkan tidak berlaku untuk stack yang dipakai di sini.

### 2. HAProxy juga tidak menjawabnya

Masalahnya bukan cara membagi trafik. Masalahnya **slot 1 dan slot 2 tidak berisi data yang sama.** Membagi trafik ke dua database yang isinya berbeda bukan load balancing — itu dua aplikasi terpisah yang kebetulan memakai kode sama.

Probe langsung ke keduanya:

| Pemeriksaan | Slot 1 | Slot 2 |
|---|---|---|
| `pg_is_in_recovery()` | `f` | `f` |
| baris di `pg_stat_replication` | 0 | 0 |
| replication slot | — | 0 |
| subscription | — | 0 |

Dua-duanya primary independen. Tidak ada hubungan apa pun di antara keduanya.

### 3. Read replica bawaan Supabase tidak berlaku

Replika Supabase beroperasi **di dalam satu project**. Dua project terpisah — yang persis situasi slot 1 dan slot 2 — tidak bisa dijadikan replika satu sama lain lewat fitur itu.

### 4. Replikasi logis: secara teknis mungkin, tapi berbayar dalam bentuk lain

Ini satu-satunya jalan yang benar-benar terbuka, dan syaratnya sudah terpenuhi. Hasil probe (dicatat supaya tidak perlu diperiksa ulang):

```
slot 1:  wal_level             = logical
         max_replication_slots = 5
         max_wal_senders       = 5
         role postgres         : replication = true

slot 2:  role postgres anggota pg_create_subscription
         (izin yang persis dibutuhkan CREATE SUBSCRIPTION di PG16+)

skema :  14 tabel, semuanya punya PRIMARY KEY (syarat replica identity)
         0 sequence — semua id String @id @default(uuid())
```

Jadi "tidak bisa" saja bukan jawaban yang jujur. Yang membuatnya tetap tidak dikerjakan adalah empat konsekuensinya:

1. **Menambah kuota, bukan menghemat.** Aliran perubahan terus-menerus Seoul→Singapura. Tujuan awalnya menghemat kuota free tier, dan slot 3 (Neon) sudah mati justru karena kuota transfer data.

2. **⚠️ WAL menumpuk kalau subscriber tertinggal — dan itu mematikan primary.** Replication slot menahan WAL di primary sampai subscriber mengkonsumsinya. Subscriber putus lama = disk primary penuh = **primary mati**. Ini yang paling keras dari keempatnya: langkah yang dipasang untuk anti-down justru jadi penyebab down, dan matinya di sisi yang sedang melayani user.

3. **DDL tidak ikut direplikasi.** Tiap `prisma migrate` harus dijalankan manual di kedua sisi, dan tabel baru harus ditambahkan ke publication. Lupa sekali = replika diam-diam ketinggalan, tanpa error.

4. **Baca-setelah-tulis bisa meleset.** User simpan transaksi → dashboard membaca dari replika yang belum menyusul → transaksi terlihat "hilang" beberapa detik. Di aplikasi keuangan itu terlihat oleh user dan langsung merusak kepercayaan.

### 5. Keuntungannya juga lebih kecil dari yang terlihat

Rasio call site di `src/`: **63 baca : 40 tulis** (61% / 39%). Dan tidak semua yang 61% itu bisa dialihkan — menurut perilaku `@prisma/extension-read-replicas`, `$transaction` dan `$queryRaw` tetap ke primary. Tiga `$transaction` interaktif ada di `sharedFinance.service.js:48`, `sharedFinance.service.js:141`, dan `sharedFinanceInvitation.service.js:175`.

### 6. Kalau kelak benar-benar mau dijalankan

Bahan-bahannya saja, **belum pernah diuji di project ini** — jadi jangan diperlakukan sebagai langkah siap pakai:

- `CREATE PUBLICATION` di slot 1
- `CREATE SUBSCRIPTION` di slot 2
- `@prisma/extension-read-replicas` di `src/config/db.js`
- migrasi dijalankan di **kedua** sisi, tiap kali

## Tiga slot database

`backend\.env` menyediakan tiga slot. **Hanya satu yang dipakai pada satu waktu** — `DATABASE_ACTIVE` menentukan yang mana.

| Slot | Provider | Host | Status |
|---|---|---|---|
| **1** | Supabase (ap-northeast-2) | `aws-0-ap-northeast-2.pooler.supabase.com:5432` (session pooler) | **aktif**, berisi data |
| **2** | Supabase (ap-southeast-1) | `aws-0-ap-southeast-1.pooler.supabase.com:5432` (session pooler) | **standby siap** — sudah direstore & diuji |
| **3** | Neon | `ep-dawn-morning-azz26y5i.c-3.ap-southeast-1.aws.neon.tech` | terisi URL, **DB kosong** (kuota Neon habis) |

**Gunakan port 5432 (session pooler), bukan 6543 (transaction pooler) + `?pgbouncer=true`.** Prisma menerima keduanya, tapi `psql` menolak query param `pgbouncer` mentah-mentah — dan `restore-db.ps1` memakai psql. Slot yang tidak bisa direstore bukan standby, cuma alamat.

Dua slot Supabase berada di **region berbeda** (Seoul dan Singapura). Itu memang menolong untuk gangguan tingkat region, tapi keduanya tetap satu provider: gangguan tingkat akun atau kebijakan Supabase mengenai keduanya sekaligus. Slot 3 di provider lain yang menutup celah itu — dan slot 3 belum berisi data.

Tiga slot **tidak** berarti load balance — lihat tiga alasan di bagian atas; menambah URL tidak mengubah satu pun dari ketiganya. Yang bertambah cuma pilihan tujuan failover.

Slot yang dipilih divalidasi saat backend start, bukan saat query pertama gagal. `DATABASE_ACTIVE=2` dengan slot kosong menolak start dengan pesan yang menyebut slotnya — bukan error koneksi samar di request acak beberapa menit kemudian.

> **Baris `DATABASE_URL` biasa tetap ada dan tetap perlu.** Prisma CLI (`migrate`, `studio`, `db pull`) membaca `.env` langsung dan tidak menjalankan `src/config/env.js`, jadi ia tidak tahu soal `DATABASE_ACTIVE`. Setelah mengganti slot, samakan juga baris itu **sebelum menjalankan perintah Prisma CLI apa pun** — kalau tidak, migrasi bisa mendarat di database yang salah tanpa peringatan.
>
> Backend yang berjalan tidak terpengaruh: `env.js` menimpa `process.env.DATABASE_URL` dengan slot terpilih sebelum PrismaClient dibuat.

> ### Status per 2026-09-02
>
> **Slot 2 siap dan sudah diuji.** Diisi lewat `restore-db.ps1`, lalu backend dijalankan dengan `DATABASE_ACTIVE=2`: `/health/db` 200, jalur login mencapai DB (401 untuk kredensial salah, bukan error koneksi), dan jumlah barisnya cocok dengan slot 1 — users=3, categories=17, transactions=3. Failover ke slot 2 bukan lagi rencana.
>
> **Slot 3 (Neon) belum bisa dipakai.** Masih menolak seluruh koneksi:
> ```
> ERROR: Your project has exceeded the data transfer quota. Upgrade your plan to increase limits.
> ```
> Bahkan `SELECT 1` ditolak, jadi restore ke sana belum bisa dijalankan. Supaya slot 3 ikut berlaku: tunggu kuota reset (bulanan) atau naikkan plan, lalu jalankan `restore-db.ps1` ke sana.
>
> **Isi slot 2 sebaru restore terakhirnya, bukan sebaru slot 1.** Data yang masuk ke slot 1 setelah itu tidak ada di sana. Jadwalkan restore ulang berkala, atau terima kehilangan sejak restore terakhir.

---

## Persiapan (sekali, harus sudah jalan SEBELUM dibutuhkan)

### 1. Backup terjadwal

```powershell
powershell -ExecutionPolicy Bypass -File backend\scripts\backup-db.ps1
```

Skrip ini menolak dump yang kehilangan salah satu dari 4 objek SQL tulisan-tangan. Dump yang tidak lolos verifikasi **tidak boleh dipakai sebagai cadangan**.

Jadwalkan harian lewat Task Scheduler:

```powershell
$act = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument '-ExecutionPolicy Bypass -File "c:\BACKUP FETSU\Belajar\FinancePribadi\backend\scripts\backup-db.ps1"'
$trg = New-ScheduledTaskTrigger -Daily -At 2:10am
Register-ScheduledTask -TaskName 'FinancePribadi-DBBackup' -Action $act -Trigger $trg
```

### 2. Isi standby

```powershell
# Lihat rencananya dulu (dry run — tidak menyentuh apa pun)
powershell -ExecutionPolicy Bypass -File backend\scripts\restore-db.ps1 `
  -TargetUrl "<DATABASE_URL Neon>"

# Baru jalankan
powershell -ExecutionPolicy Bypass -File backend\scripts\restore-db.ps1 `
  -TargetUrl "<DATABASE_URL Neon>" -Confirm
```

Skrip ini **menghapus seluruh isi schema public di tujuan** sebelum restore — itu memang perlu, karena restore ke database yang sudah berisi akan gagal di `CREATE TABLE`. Tiga pengaman menahan salah sasaran:

1. `-TargetUrl` wajib eksplisit; skrip tidak pernah menebak dari `.env`
2. **Menolak** kalau host tujuan sama dengan `DATABASE_URL` yang aktif — bahkan ketika `-Confirm` diberikan
3. Tanpa `-Confirm` hanya menampilkan rencana

Restore-nya `--single-transaction` + `ON_ERROR_STOP=1`: isi dump di-commit seluruhnya atau tidak sama sekali. Gagal di tengah tidak meninggalkan standby setengah jadi — dan standby setengah jadi lebih berbahaya daripada tidak ada standby, karena terlihat siap padahal tidak.

**Yang TIDAK ikut ter-rollback: `DROP SCHEMA`.** Itu berjalan sebagai perintah terpisah sebelum transaksi restore. Kalau restore gagal setelahnya, isi lama di tujuan sudah hilang dan tujuan tinggal kosong. Skrip mengatakannya terus terang saat itu terjadi — jangan dibaca sebagai "tidak ada yang berubah".

Di akhir, skrip memverifikasi tujuan: 14 tabel, 3 CHECK, 1 partial unique index, 10 migrasi. Kalau constraint tulisan-tangan tidak lengkap, ia keluar dengan status gagal dan standby dinyatakan tidak layak.

Ulangi tiap kali ada backup baru yang ingin dijadikan titik pulih. Isi standby hanya sebaru restore terakhir, bukan sebaru dump terakhir.

### 3. Monitor uptime

Arahkan monitor eksternal (UptimeRobot dsb) ke:

```
GET https://be.fetsu.id/api/v1/health/db
```

200 = DB hidup, **503 = DB mati** dengan sebabnya di body. Jangan pakai `/api/v1/health` untuk ini — endpoint itu sengaja tidak menyentuh DB (dipakai klien mobile tiap 45 detik) dan akan tetap 200 walau database mati total.

---

## Failover (saat DB aktif mati)

### Langkah 1 — Pastikan memang DB-nya, bukan backend

```powershell
curl.exe -s -o NUL -w "%{http_code}\n" https://be.fetsu.id/api/v1/health
curl.exe -s https://be.fetsu.id/api/v1/health/db
```

| `/health` | `/health/db` | Artinya |
|---|---|---|
| gagal | gagal | Backend/hosting yang mati — failover DB **tidak** menolong |
| 200 | 503 | Database yang bermasalah — lanjut ke langkah 2 |
| 200 | 200 | DB sehat — masalahnya di tempat lain |

Body `/health/db` menyebut sebabnya: kuota terlampaui, autentikasi gagal, atau tidak terjangkau. Ketiganya butuh tindakan berbeda — hanya yang pertama dan ketiga yang dijawab failover.

### Langkah 2 — Pindah slot

```powershell
Copy-Item backend\.env backend\.env.aktif.bak
```

Edit `backend\.env`, ubah satu angka:

```
DATABASE_ACTIVE=1     ->     DATABASE_ACTIVE=3
```

Itu saja. URL-nya tidak perlu disalin, dipindah, atau dikomentari — ketiganya sudah tersimpan di `DATABASE_URL_1/2/3` dan yang tidak dipilih tinggal diam. Tidak ada lagi risiko dua baris aktif sekaligus.

Samakan juga baris `DATABASE_URL` biasa **kalau berencana menjalankan Prisma CLI** (`migrate`, `studio`, `db pull`) — CLI tidak membaca `DATABASE_ACTIVE`. Backend yang berjalan tidak peduli.

Cek cepat setelah mengedit:
```powershell
Get-Content backend\.env | Where-Object { $_ -match '^\s*DATABASE_ACTIVE' }
```

`schema.prisma` tidak perlu diubah dan `prisma generate` tidak perlu diulang.

### Langkah 3 — Restart

Restart proses backend sesuai cara hosting yang dipakai. Kalau lewat PM2, `--update-env` **wajib** — tanpa itu PM2 memakai ulang environment proses lama dan tetap menyambung ke database yang mati.

### Langkah 4 — Verifikasi (jangan dilewati)

0. Log start backend mencetak slot dan host yang benar-benar tersambung:
   ```
   [db] slot 3 -> ep-dawn-morning-....neon.tech
   ```
   Kalau slotnya masih yang lama, prosesnya belum benar-benar restart.
1. `GET /api/v1/health/db` → 200
2. Login dengan akun sungguhan
3. Buka dashboard, buka foto profil
4. Buat lalu hapus satu transaksi uji

Kalau `/health/db` 200 tapi login gagal, standby-nya berisi skema tanpa data — restore backup dulu, jangan biarkan user mendaftar di database kosong.

---

## Balik ke database semula

```powershell
Copy-Item backend\.env.aktif.bak backend\.env -Force
```
lalu restart.

**Data yang ditulis user selama failover ada di standby, bukan di database semula.** Balik tanpa memindahkan data itu = menghilangkannya. Urutannya: dump dari standby → restore ke database semula → baru tukar `.env`.

---

## Latihan failover (wajib sekali, sebelum dibutuhkan)

Jalankan saat tenang, bukan saat produksi mati. Pakai backend lokal supaya user tidak terkena.

```powershell
# 1. Backup + isi standby
powershell -ExecutionPolicy Bypass -File backend\scripts\backup-db.ps1
powershell -ExecutionPolicy Bypass -File backend\scripts\restore-db.ps1 -TargetUrl "<Neon>" -Confirm

# 2. Ubah DATABASE_ACTIVE ke slot standby, restart lokal, lalu:
curl.exe -s http://localhost:5183/api/v1/health/db     # harus 200
# login, buka dashboard, buka foto profil, buat+hapus 1 transaksi

# 3. Balik ke Supabase, restart, cek lagi
```

Yang dibuktikan latihan ini dan tidak bisa dibuktikan dokumen: standby benar-benar berisi data, constraint tulisan-tangan ikut terbawa, dan urutan langkahnya masih cocok dengan cara hosting yang dipakai sekarang.

Catat berapa lama langkah 2 memakan waktu. Angka itu yang sebenarnya berlaku saat kejadian, bukan target di kepala.

## Kolom waktu berisi jam Jakarta, bukan UTC

Sejak migrasi `20260902143500_store_time_as_jakarta`, seluruh kolom `timestamp`
di database menyimpan **jam dinding WIB**, bukan UTC. Buka `users.created_at` di
Supabase Studio dan angkanya langsung sama dengan jam di layar ponsel.

Tipenya tetap `timestamp without time zone` — kolomnya tidak membawa zona, jadi
yang menjaga artinya adalah kode, bukan database:

- **`src/config/timezone.js`** menggeser `+7 jam` saat menulis dan `−7 jam` saat
  membaca. Dua arah. Menghapus salah satu arah membuat seluruh jam meleset 7 jam
  **tanpa error apa pun** — tidak ada yang gagal, angkanya saja yang salah.
- **Migrasi di atas** menggeser data lama satu kali. Tidak idempoten:
  menjalankan file SQL-nya manual dua kali menggeser data 14 jam.
- Kolom `DATE` (`transactions.date`, `budgets.month_year`, `debts.due_date`,
  `savings_goals.deadline`, `shared_transactions.date`) **tidak** digeser —
  menggesernya akan memindahkan tanggalnya satu hari.

Yang penting saat failover dan restore:

- **Backup dari slot berisi WIB, restore ke slot mana pun tetap WIB.** `pg_dump`
  membawa nilai apa adanya dan kolomnya tanpa zona, jadi tidak ada konversi
  diam-diam saat pindah region (Seoul → Singapura → Neon). Tidak ada langkah
  tambahan.
- **Jangan jalankan file migrasi itu manual** di standby. `prisma migrate
  deploy` mencatat di `_prisma_migrations` dan tidak akan mengulang; psql tidak
  punya perlindungan itu.
- Kalau standby diisi dari dump **sebelum** 2 September 2026, isinya masih UTC
  sementara kode sudah menggeser — seluruh jam akan tampil mundur 7 jam. Ciri
  paling cepat: `SELECT max(created_at) FROM users` jauh lebih kecil dari jam WIB
  sekarang. Perbaikannya menjalankan UPDATE `+ INTERVAL '7 hours'` di migrasi
  itu satu kali, bukan mengubah kode.

Yang menghapus seluruh kerumitan ini adalah mengubah kolomnya ke `timestamptz`,
bukan menghapus `timezone.js`.

---

## Yang lebih layak dikerjakan untuk anti-down

Ditemukan sambil memeriksa hal di atas. Ketiganya lebih dekat ke tujuan "anti-down" daripada load balancing, dan tidak menambah kuota sama sekali. Dicatat supaya tidak hilang — **belum dikerjakan.**

- **`src/middlewares/error.middleware.js:5` membocorkan detail koneksi.** Ia meneruskan `err.message` mentah ke klien. Saat DB bermasalah, pesan Prisma memuat **host, port, dan username database** — dan itu keluar lewat endpoint mana pun. Ironisnya `systemHealth.service.js:39-69` sudah menyaring hal yang sama dengan hati-hati lewat `describeDbError()`; fungsi itu bisa dipakai ulang, jadi ini bukan pekerjaan dari nol.

- **Tidak ada retry/backoff sama sekali** di seluruh `src/`. Satu gangguan koneksi sesaat langsung jadi 500 ke user, padahal percobaan ulang beberapa ratus milidetik kemudian akan berhasil. Ini menutup jenis "down" yang paling sering terjadi dan paling tidak butuh failover.

- **Restore berkala ke slot 2.** Isinya sebaru restore terakhir, bukan sebaru slot 1. Tanpa jadwal, jarak itu melebar diam-diam sampai ketahuan saat failover — waktu paling buruk untuk mengetahuinya.

## Jangan lakukan ini

- **Jangan tulis ke dua database sekaligus** untuk "berjaga-jaga". Lihat tiga alasan di bagian atas. Tiga slot di `.env` adalah tiga *pilihan*, bukan tiga koneksi hidup.
- **Jangan jalankan Prisma CLI tanpa menyamakan baris `DATABASE_URL` dulu.** CLI tidak membaca `DATABASE_ACTIVE`; `prisma migrate deploy` bisa mengubah skema database yang sedang tidak dipakai — atau yang sedang dipakai produksi, tergantung arah kelirunya.
- **Jangan gabungkan `/health/db` ke `/health`.** Klien mobile nge-ping `/health` tiap 45 detik; kalau ia menyentuh DB, tiap perangkat aktif menambah beban ke database yang sedang bermasalah, dan probe konektivitas ikut gagal — klien akan salah menampilkan layar offline padahal backend hidup.
- **Jangan anggap failover selesai kalau belum pernah dijalankan.** Prosedur yang belum diuji bukan failover, cuma dokumen.
