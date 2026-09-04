-- Penanda notifikasi kedaluwarsa PREMIUM, dipakai penjadwal di
-- src/config/scheduler.js lewat plan.notifier.service.js.
--
-- Keduanya menyimpan SALINAN expires_at yang notifikasinya sudah terkirim,
-- bukan boolean dan bukan waktu pengiriman. Dengan begitu perpanjangan tier
-- (yang mengubah expires_at) otomatis membuat penanda lama tidak cocok lagi,
-- dan peringatan siklus berikutnya hidup kembali tanpa ada kode yang perlu
-- mengingat untuk mereset apa pun.
--
-- Nullable tanpa DEFAULT: baris lama bernilai NULL, yang berarti "belum pernah
-- diberitahu". Itu memang keadaan yang benar untuk mereka, jadi migrasi ini
-- hanya menambah kolom dan tidak menyentuh satu baris pun.
--
-- TIMESTAMP(3) tanpa zona, isinya jam Jakarta seperti seluruh kolom waktu lain
-- di database ini -- lihat src/config/timezone.js.

-- AlterTable
ALTER TABLE "user_plans" ADD COLUMN "warned_for" TIMESTAMP(3);
ALTER TABLE "user_plans" ADD COLUMN "expired_notified_for" TIMESTAMP(3);
