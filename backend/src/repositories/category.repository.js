import { prisma } from "../config/db.js";

export const categoryRepository = {
  // Kategori global (userId null) + kategori milik user
  listForUser: (userId, type) =>
    prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        ...(type ? { type } : {}),
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),

  findAccessible: (id, userId) =>
    prisma.category.findFirst({
      where: { id, OR: [{ userId: null }, { userId }] },
    }),

  create: (data) => prisma.category.create({ data }),
};
