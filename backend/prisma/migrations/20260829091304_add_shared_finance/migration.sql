-- CreateTable
CREATE TABLE "shared_finances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "ownership_transferred_at" TIMESTAMP(3),
    "previous_owner_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_finances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_finance_members" (
    "id" TEXT NOT NULL,
    "shared_finance_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_finance_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_finance_invitations" (
    "id" TEXT NOT NULL,
    "shared_finance_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "max_uses" INTEGER,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_finance_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_transactions" (
    "id" TEXT NOT NULL,
    "shared_finance_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "type" "CategoryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shared_finances_created_by_idx" ON "shared_finances"("created_by");

-- CreateIndex
CREATE INDEX "shared_finance_members_user_id_status_idx" ON "shared_finance_members"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_shared_finance_member" ON "shared_finance_members"("shared_finance_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_finance_invitations_code_key" ON "shared_finance_invitations"("code");

-- CreateIndex
CREATE INDEX "shared_finance_invitations_shared_finance_id_idx" ON "shared_finance_invitations"("shared_finance_id");

-- CreateIndex
CREATE INDEX "shared_transactions_shared_finance_id_date_idx" ON "shared_transactions"("shared_finance_id", "date");

-- CreateIndex
CREATE INDEX "shared_transactions_shared_finance_id_deleted_at_idx" ON "shared_transactions"("shared_finance_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "shared_finances" ADD CONSTRAINT "shared_finances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_finance_members" ADD CONSTRAINT "shared_finance_members_shared_finance_id_fkey" FOREIGN KEY ("shared_finance_id") REFERENCES "shared_finances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_finance_members" ADD CONSTRAINT "shared_finance_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_finance_invitations" ADD CONSTRAINT "shared_finance_invitations_shared_finance_id_fkey" FOREIGN KEY ("shared_finance_id") REFERENCES "shared_finances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_finance_invitations" ADD CONSTRAINT "shared_finance_invitations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_transactions" ADD CONSTRAINT "shared_transactions_shared_finance_id_fkey" FOREIGN KEY ("shared_finance_id") REFERENCES "shared_finances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_transactions" ADD CONSTRAINT "shared_transactions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_transactions" ADD CONSTRAINT "shared_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===========================================================================
-- DITULIS TANGAN. Prisma tidak bisa menghasilkan bagian di bawah ini, jadi
-- introspeksi schema TIDAK MELIHATNYA: `prisma migrate diff` akan tetap bilang
-- "in sync" baik constraint ini ada maupun hilang. Konsekuensinya: mereplay
-- migrasi (migrate reset) aman, tapi MENGGABUNGKAN/menulis ulang migrasi akan
-- membuang semua ini tanpa satu pun peringatan.
-- ===========================================================================

-- Domain nilai role & status (PRD_KB.md §5, §6). Sengaja VARCHAR + CHECK, bukan
-- enum Postgres: PRD memintanya begitu, dan menambah nilai baru nanti cukup
-- mengganti CHECK alih-alih ALTER TYPE.
ALTER TABLE "shared_finance_members"
  ADD CONSTRAINT "chk_shared_finance_member_role"
  CHECK ("role" IN ('OWNER', 'MEMBER'));

ALTER TABLE "shared_finance_members"
  ADD CONSTRAINT "chk_shared_finance_member_status"
  CHECK ("status" IN ('ACTIVE', 'LEFT', 'REMOVED'));

-- PRD_KB.md §7 & §10: tepat SATU owner aktif per keuangan bersama — tidak pernah
-- 0, tidak pernah 2. Prisma @@unique tidak bisa menyatakan klausa WHERE, jadi
-- index parsial ini satu-satunya tempat invariant itu benar-benar ditegakkan.
--
-- Efek sampingnya disengaja: karena Postgres memeriksa unique index PER
-- STATEMENT (bukan ditunda sampai commit), transfer ownership WAJIB menurunkan
-- owner lama dulu baru menaikkan yang baru. Promote-duluan akan membatalkan
-- transaksinya, dan itu memang perilaku yang diinginkan.
CREATE UNIQUE INDEX "uq_shared_finance_single_active_owner"
  ON "shared_finance_members" ("shared_finance_id")
  WHERE "role" = 'OWNER' AND "status" = 'ACTIVE';

-- Nominal nol atau negatif tidak punya arti di sini; tanda INCOME/EXPENSE
-- dibawa kolom "type", bukan tanda angkanya.
ALTER TABLE "shared_transactions"
  ADD CONSTRAINT "chk_shared_transaction_amount_positive"
  CHECK ("amount" > 0);
