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

  // Buang log yang lebih tua dari retensi, untuk SEMUA user.
  // Balikannya { count } dari Prisma.
  //
  // Tidak seperti refresh_tokens, di sini tidak ada baris yang "mati" — setiap
  // log tetap sah selamanya. Yang membatasi cuma umur, dan itu keputusan
  // kebijakan: berapa lama jejak audit masih berguna. Setelah dihapus, filter
  // tanggal di panel admin (buildWhere di atas) tidak akan menemukan apa pun
  // untuk rentang itu.
  deleteOlderThan: (retentionDays) => {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    return prisma.activityLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  },
};
