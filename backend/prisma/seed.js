import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Kategori default global (userId null) sesuai PRD §Core Features 2 & 3
const DEFAULT_CATEGORIES = [
  { name: "Gaji", type: "INCOME", icon: "payments" },
  { name: "Bonus", type: "INCOME", icon: "redeem" },
  { name: "Freelance", type: "INCOME", icon: "handyman" },
  { name: "Usaha", type: "INCOME", icon: "storefront" },
  { name: "Hadiah", type: "INCOME", icon: "card_giftcard" },
  { name: "Pemasukan Lainnya", type: "INCOME", icon: "more_horiz" },
  { name: "Makanan", type: "EXPENSE", icon: "restaurant" },
  { name: "Transportasi", type: "EXPENSE", icon: "directions_bus" },
  { name: "Belanja", type: "EXPENSE", icon: "shopping_bag" },
  { name: "Tagihan", type: "EXPENSE", icon: "receipt_long" },
  { name: "Pendidikan", type: "EXPENSE", icon: "school" },
  { name: "Hiburan", type: "EXPENSE", icon: "movie" },
  { name: "Kesehatan", type: "EXPENSE", icon: "favorite" },
  { name: "Asuransi", type: "EXPENSE", icon: "shield" },
  { name: "Investasi", type: "EXPENSE", icon: "trending_up" },
  { name: "Donasi", type: "EXPENSE", icon: "volunteer_activism" },
  { name: "Lainnya", type: "EXPENSE", icon: "more_horiz" },
];

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    // Dicocokkan lewat type+icon (kombinasi unik per kategori default; icon
    // "more_horiz" dipakai 2x tapi beda type), bukan name — supaya rename
    // (mis. Food -> Makanan) meng-update baris lama di tempat, bukan membuat
    // duplikat baru sementara transaksi/budget lama masih menunjuk ke
    // kategori dengan nama Inggris yang lama.
    const existing = await prisma.category.findFirst({
      where: { userId: null, type: category.type, icon: category.icon },
    });
    if (existing) {
      await prisma.category.update({ where: { id: existing.id }, data: category });
    } else {
      await prisma.category.create({ data: category });
    }
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
