-- Tier komersial per akun (PRD.md §Monetization).
--
-- Dua tabel, bukan satu kolom di `users`:
--   user_plans  = keadaan SEKARANG, satu baris per akun
--   plan_grants = riwayat append-only, satu baris tiap perubahan
--
-- Tidak ada backfill dan tidak ada DEFAULT di `users`: akun tanpa baris di
-- user_plans dibaca sebagai FREE oleh resolveTier() di plan.service.js. Karena
-- itu migrasi ini AMAN dijalankan pada database berisi -- ia hanya menambah,
-- tidak menyentuh satu baris pun yang sudah ada.
--
-- Kolom waktu memakai TIMESTAMP(3) tanpa zona, mengikuti seluruh tabel lain di
-- database ini. Isinya jam Jakarta, bukan UTC -- lihat src/config/timezone.js.
-- Model UserPlan dan PlanGrant sudah didaftarkan di NOW_FIELDS/UPDATED_AT_FIELDS
-- pada berkas itu; tanpa pendaftaran tersebut waktunya akan terbaca 7 jam mundur.

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'PREMIUM', 'LIFETIME');

-- CreateTable
CREATE TABLE "user_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" "Tier" NOT NULL DEFAULT 'FREE',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_grants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "granted_by_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- UNIQUE, bukan index biasa: satu akun tidak boleh punya dua tier aktif.
-- Inilah yang membuat upsert di userPlan.repository.js tidak bisa diam-diam
-- menghasilkan baris kembar saat dua request datang bersamaan.
CREATE UNIQUE INDEX "user_plans_user_id_key" ON "user_plans"("user_id");

-- CreateIndex
CREATE INDEX "plan_grants_user_id_created_at_idx" ON "plan_grants"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_grants" ADD CONSTRAINT "plan_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- SET NULL, bukan CASCADE: menghapus akun admin tidak boleh menghapus jejak
-- pemberian tier kepada orang lain. Riwayatnya bertahan, pelakunya jadi null.
ALTER TABLE "plan_grants" ADD CONSTRAINT "plan_grants_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
