-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_currency" TEXT NOT NULL DEFAULT 'IDR',
ALTER COLUMN "updated_at" DROP DEFAULT;
