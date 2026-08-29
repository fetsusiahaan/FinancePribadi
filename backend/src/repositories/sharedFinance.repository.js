import { prisma } from "../config/db.js";

export const sharedFinanceRepository = {
  // Daftar keuangan bersama yang user-nya masih anggota aktif. Difilter lewat
  // relasi `members`, bukan `createdBy`: pembuat bisa saja sudah mengalihkan
  // kepemilikan lalu keluar, dan anggota biasa tidak pernah jadi pembuat.
  listForUser: (userId, { archived } = {}) =>
    prisma.sharedFinance.findMany({
      where: {
        ...(archived === undefined ? {} : { isArchived: archived }),
        members: { some: { userId, status: "ACTIVE" } },
      },
      include: {
        _count: { select: { members: { where: { status: "ACTIVE" } } } },
        members: { where: { userId, status: "ACTIVE" }, select: { role: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

  findById: (id) =>
    prisma.sharedFinance.findUnique({
      where: { id },
      include: { _count: { select: { members: { where: { status: "ACTIVE" } } } } },
    }),

  update: (id, data, client = prisma) => client.sharedFinance.update({ where: { id }, data }),

  // Hard delete. Cascade di skema ikut menghapus anggota, undangan, dan
  // transaksi bersamanya — memang itu yang diminta PRD untuk aksi ini.
  remove: (id) => prisma.sharedFinance.delete({ where: { id } }),

  create: (data, client = prisma) => client.sharedFinance.create({ data }),
};
