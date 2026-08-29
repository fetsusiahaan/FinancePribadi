import { prisma } from "../config/db.js";

// Transaksi bersama dihapus secara LUNAK (deletedAt). Filternya ditaruh di sini,
// di satu pembangun `where`, bukan disebar ke tiap service — satu tempat yang
// lupa menyaring berarti baris terhapus muncul lagi di daftar orang lain.
function scope(sharedFinanceId, extra = {}) {
  return { sharedFinanceId, deletedAt: null, ...extra };
}

const withRelations = {
  category: true,
  createdBy: { select: { id: true, name: true } },
};

export const sharedTransactionRepository = {
  list: ({ sharedFinanceId, skip, take, type, start, end }) => {
    const where = scope(sharedFinanceId, {
      ...(type ? { type } : {}),
      ...(start && end ? { date: { gte: start, lt: end } } : {}),
    });
    return prisma.$transaction([
      prisma.sharedTransaction.findMany({
        where,
        include: withRelations,
        // createdAt sebagai tiebreak, bukan id: id-nya uuid v4 alias acak, dan
        // di tabel dengan banyak penulis urutan "siapa mencatat terakhir" harus
        // benar-benar mencerminkan waktu.
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      prisma.sharedTransaction.count({ where }),
    ]);
  },

  findInFinance: (id, sharedFinanceId) =>
    prisma.sharedTransaction.findFirst({
      where: scope(sharedFinanceId, { id }),
      include: withRelations,
    }),

  create: (data) => prisma.sharedTransaction.create({ data, include: withRelations }),

  update: (id, data) =>
    prisma.sharedTransaction.update({ where: { id }, data, include: withRelations }),

  softDelete: (id) =>
    prisma.sharedTransaction.update({ where: { id }, data: { deletedAt: new Date() } }),

  sumByType: (sharedFinanceId, start, end) =>
    prisma.sharedTransaction.groupBy({
      by: ["type"],
      where: scope(sharedFinanceId, { ...(start && end ? { date: { gte: start, lt: end } } : {}) }),
      _sum: { amount: true },
    }),

  // Rincian per anggota untuk layar ringkasan: siapa mencatat berapa.
  sumByMember: (sharedFinanceId, start, end) =>
    prisma.sharedTransaction.groupBy({
      by: ["createdByUserId", "type"],
      where: scope(sharedFinanceId, { ...(start && end ? { date: { gte: start, lt: end } } : {}) }),
      _sum: { amount: true },
    }),
};
