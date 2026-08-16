import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Kategori default global (userId null) sesuai PRD §Core Features 2 & 3
const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "INCOME", icon: "payments" },
  { name: "Bonus", type: "INCOME", icon: "redeem" },
  { name: "Freelance", type: "INCOME", icon: "handyman" },
  { name: "Business", type: "INCOME", icon: "storefront" },
  { name: "Gift", type: "INCOME", icon: "card_giftcard" },
  { name: "Other Income", type: "INCOME", icon: "more_horiz" },
  { name: "Food", type: "EXPENSE", icon: "restaurant" },
  { name: "Transportation", type: "EXPENSE", icon: "directions_bus" },
  { name: "Shopping", type: "EXPENSE", icon: "shopping_bag" },
  { name: "Bills", type: "EXPENSE", icon: "receipt_long" },
  { name: "Education", type: "EXPENSE", icon: "school" },
  { name: "Entertainment", type: "EXPENSE", icon: "movie" },
  { name: "Health", type: "EXPENSE", icon: "favorite" },
  { name: "Insurance", type: "EXPENSE", icon: "shield" },
  { name: "Investment", type: "EXPENSE", icon: "trending_up" },
  { name: "Donation", type: "EXPENSE", icon: "volunteer_activism" },
  { name: "Others", type: "EXPENSE", icon: "more_horiz" },
];

async function main() {
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { userId: null, name: category.name },
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
