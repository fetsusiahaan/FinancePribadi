import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email) {
    console.error("Usage: node prisma/seed-admin.js EMAIL [password] [name]");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`Promoted existing user to ADMIN: ${user.id} (${user.email})`);
    return;
  }

  if (!password) {
    console.error(`User ${email} does not exist. Provide a password to create one: node prisma/seed-admin.js EMAIL PASSWORD [NAME]`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || "Admin", role: "ADMIN" },
  });
  console.log(`Created new ADMIN user: ${user.id} (${user.email})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
