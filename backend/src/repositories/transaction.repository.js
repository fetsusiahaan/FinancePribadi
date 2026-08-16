import { prisma } from "../config/db.js";

export const transactionRepository = {
  list: ({ userId, skip, take, type, categoryId, start, end }) => {
    const where = {
      userId,
      ...(categoryId ? { categoryId } : {}),
      ...(type ? { category: { type } } : {}),
      ...(start && end ? { date: { gte: start, lt: end } } : {}),
    };
    return prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);
  },

  findOwned: (id, userId) =>
    prisma.transaction.findFirst({ where: { id, userId }, include: { category: true } }),

  create: (data) => prisma.transaction.create({ data, include: { category: true } }),

  update: (id, data) =>
    prisma.transaction.update({ where: { id }, data, include: { category: true } }),

  remove: (id) => prisma.transaction.delete({ where: { id } }),

  sumByType: (userId, type, start, end) =>
    prisma.transaction.aggregate({
      where: { userId, category: { type }, ...(start && end ? { date: { gte: start, lt: end } } : {}) },
      _sum: { amount: true },
    }),

  groupByCategory: (userId, type, start, end) =>
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, category: { type }, ...(start && end ? { date: { gte: start, lt: end } } : {}) },
      _sum: { amount: true },
    }),

  recent: (userId, take = 5) =>
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      take,
    }),
};
