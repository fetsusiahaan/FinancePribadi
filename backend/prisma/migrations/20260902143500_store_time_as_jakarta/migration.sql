-- Ubah isi kolom waktu dari UTC menjadi jam Jakarta (WIB, UTC+7).
--
-- KENAPA: kolom waktu harus terbaca sebagai jam dinding Jakarta saat tabel
-- dibuka langsung di Supabase Studio atau psql, tanpa menghitung di kepala.
--
-- Ini migrasi DATA, bukan skema. Tidak ada tipe kolom yang berubah: semuanya
-- tetap `timestamp without time zone`. Yang berubah hanya NILAI di dalamnya,
-- digeser maju 7 jam satu kali.
--
-- PASANGANNYA DI KODE APLIKASI: src/config/timezone.js. Migrasi ini TIDAK
-- BOLEH dijalankan tanpa kode itu terpasang, dan sebaliknya. Keduanya satu
-- perubahan yang dipecah dua:
--   - migrasi ini menggeser data LAMA satu kali
--   - timezone.js menggeser data BARU terus-menerus, dua arah
-- Menjalankan salah satu saja membuat seluruh jam di aplikasi meleset 7 jam.
--
-- SEKALI JALAN, TIDAK IDEMPOTEN. Menjalankan UPDATE ini dua kali menggeser
-- data 14 jam. Prisma mencatat migrasi yang sudah selesai di _prisma_migrations
-- sehingga `migrate deploy` tidak akan mengulanginya -- tapi menjalankan file
-- SQL ini manual lewat psql tidak punya perlindungan itu. Jangan.
--
-- YANG SENGAJA TIDAK DISENTUH:
--   - kolom DATE (transactions.date, budgets.month_year, debts.due_date,
--     savings_goals.deadline, shared_transactions.date). Kolom itu tidak
--     menyimpan jam; menggesernya akan memindahkan tanggalnya satu hari.
--   - _prisma_migrations. Tabel milik Prisma, kolomnya timestamptz (sudah
--     membawa zona sendiri) dan bukan data aplikasi.
--
-- DEFAULT CURRENT_TIMESTAMP pada 10 kolom sengaja DIBIARKAN apa adanya.
-- Nilainya tidak akan terpakai lagi: timezone.js mengisi createdAt/joinedAt/
-- lastSeenAt secara eksplisit pada setiap create, sehingga DEFAULT tidak
-- pernah aktif. Mengubah DEFAULT menjadi `CURRENT_TIMESTAMP + interval '7
-- hours'` akan menaruh separuh aturan zona waktu di migrasi dan separuh lagi
-- di kode -- dan yang di migrasi tidak terlihat saat membaca kode aplikasi.

UPDATE "users" SET "created_at" = "created_at" + INTERVAL '7 hours' WHERE "created_at" IS NOT NULL;
UPDATE "users" SET "updated_at" = "updated_at" + INTERVAL '7 hours' WHERE "updated_at" IS NOT NULL;

UPDATE "activity_logs" SET "created_at" = "created_at" + INTERVAL '7 hours' WHERE "created_at" IS NOT NULL;

UPDATE "device_tokens" SET "created_at"   = "created_at"   + INTERVAL '7 hours' WHERE "created_at"   IS NOT NULL;
UPDATE "device_tokens" SET "last_seen_at" = "last_seen_at" + INTERVAL '7 hours' WHERE "last_seen_at" IS NOT NULL;

UPDATE "refresh_tokens" SET "created_at" = "created_at" + INTERVAL '7 hours' WHERE "created_at" IS NOT NULL;
UPDATE "refresh_tokens" SET "expires_at" = "expires_at" + INTERVAL '7 hours' WHERE "expires_at" IS NOT NULL;
UPDATE "refresh_tokens" SET "revoked_at" = "revoked_at" + INTERVAL '7 hours' WHERE "revoked_at" IS NOT NULL;

UPDATE "shared_finances" SET "created_at"               = "created_at"               + INTERVAL '7 hours' WHERE "created_at"               IS NOT NULL;
UPDATE "shared_finances" SET "updated_at"               = "updated_at"               + INTERVAL '7 hours' WHERE "updated_at"               IS NOT NULL;
UPDATE "shared_finances" SET "archived_at"              = "archived_at"              + INTERVAL '7 hours' WHERE "archived_at"              IS NOT NULL;
UPDATE "shared_finances" SET "ownership_transferred_at" = "ownership_transferred_at" + INTERVAL '7 hours' WHERE "ownership_transferred_at" IS NOT NULL;

UPDATE "shared_finance_members" SET "created_at" = "created_at" + INTERVAL '7 hours' WHERE "created_at" IS NOT NULL;
UPDATE "shared_finance_members" SET "updated_at" = "updated_at" + INTERVAL '7 hours' WHERE "updated_at" IS NOT NULL;
UPDATE "shared_finance_members" SET "joined_at"  = "joined_at"  + INTERVAL '7 hours' WHERE "joined_at"  IS NOT NULL;
UPDATE "shared_finance_members" SET "left_at"    = "left_at"    + INTERVAL '7 hours' WHERE "left_at"    IS NOT NULL;

UPDATE "shared_finance_invitations" SET "created_at" = "created_at" + INTERVAL '7 hours' WHERE "created_at" IS NOT NULL;
UPDATE "shared_finance_invitations" SET "expires_at" = "expires_at" + INTERVAL '7 hours' WHERE "expires_at" IS NOT NULL;
UPDATE "shared_finance_invitations" SET "revoked_at" = "revoked_at" + INTERVAL '7 hours' WHERE "revoked_at" IS NOT NULL;

UPDATE "shared_transactions" SET "created_at" = "created_at" + INTERVAL '7 hours' WHERE "created_at" IS NOT NULL;
UPDATE "shared_transactions" SET "updated_at" = "updated_at" + INTERVAL '7 hours' WHERE "updated_at" IS NOT NULL;
UPDATE "shared_transactions" SET "deleted_at" = "deleted_at" + INTERVAL '7 hours' WHERE "deleted_at" IS NOT NULL;
