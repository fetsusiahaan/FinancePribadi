import { prisma } from "../config/db.js";

export const userRepository = {
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  create: (data) => prisma.user.create({ data }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  remove: (id) => prisma.user.delete({ where: { id } }),

  findAllPaginated: ({ skip, take, search }) => {
    const where = search
      ? { OR: [{ email: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] }
      : {};
    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
        financialScore: true,
        createdAt: true,
      },
    });
  },

  count: ({ search } = {}) => {
    const where = search
      ? { OR: [{ email: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] }
      : {};
    return prisma.user.count({ where });
  },

  countByRole: (role) => prisma.user.count({ where: { role } }),
};
