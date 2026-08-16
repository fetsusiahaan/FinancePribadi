import { prisma } from "../config/db.js";

export const budgetRepository = {
  listByMonth: (userId, monthStart) =>
    prisma.budget.findMany({
      where: { userId, monthYear: monthStart },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    }),

  findOwned: (id, userId) =>
    prisma.budget.findFirst({ where: { id, userId }, include: { category: true } }),

  findByCategoryMonth: (userId, categoryId, monthStart) =>
    prisma.budget.findFirst({ where: { userId, categoryId, monthYear: monthStart } }),

  create: (data) => prisma.budget.create({ data, include: { category: true } }),

  update: (id, data) => prisma.budget.update({ where: { id }, data, include: { category: true } }),

  remove: (id) => prisma.budget.delete({ where: { id } }),
};
