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

  // Dua fungsi di bawah khusus Keuangan Bersama: HANYA kategori global.
  //
  // Kategori pribadi (userId != null) tidak boleh masuk ke ruang bersama.
  // Anggota lain tidak akan pernah bisa mengambilnya lewat findAccessible, jadi
  // merujuknya berarti menampilkan nama kategori yang tidak bisa di-resolve —
  // sekaligus membocorkan taksonomi pribadi si pembuat ke semua anggota.
  findGlobal: (id) => prisma.category.findFirst({ where: { id, userId: null } }),

  listGlobal: (type) =>
    prisma.category.findMany({
      where: { userId: null, ...(type ? { type } : {}) },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
};
