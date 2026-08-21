import { prisma } from "../config/db.js";

function buildWhere({ userSearch, action, module, ip, date }) {
  const where = {};
  if (userSearch) {
    where.user = {
      OR: [
        { name: { contains: userSearch, mode: "insensitive" } },
        { email: { contains: userSearch, mode: "insensitive" } },
      ],
    };
  }
  if (action) where.action = action;
  if (module) where.module = module;
  if (ip) where.ipAddress = { contains: ip };
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }
  return where;
}

export const activityLogRepository = {
  create: (data) => prisma.activityLog.create({ data }),

  list: (filters, { skip, take }) =>
    prisma.activityLog.findMany({
      where: buildWhere(filters),
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),

  count: (filters) => prisma.activityLog.count({ where: buildWhere(filters) }),
};
