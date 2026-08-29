import { prisma } from "../config/db.js";

export const refreshTokenRepository = {
  create: (data) => prisma.refreshToken.create({ data }),
  findValidByHash: (tokenHash) =>
    prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  findByHash: (tokenHash) => prisma.refreshToken.findUnique({ where: { tokenHash } }),
  revoke: (id) => prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }),

  // Buang baris yang sudah tidak mungkin dipakai lagi, untuk SEMUA user.
  // Balikannya { count } dari Prisma.
  //
  // Dua kategori: kedaluwarsa (expiresAt lewat), dan sudah dicabut lebih lama
  // dari masa tenggang. Rotasi mencabut token lama setiap kali dipakai
  // (refreshToken.service.js:28), jadi kategori kedua penyumbang terbesarnya.
  //
  // Tenggang dalam MENIT, bukan hari: menit bisa menyatakan hitungan hari
  // (1440 = sehari) tapi hari tidak bisa menyatakan menit. Satuan yang lebih
  // halus tidak menghilangkan pilihan apa pun.
  //
  // Nilai 0 berarti hapus seketika. Itu sah, tapi menghapus jejak untuk
  // mendeteksi token curian yang dipakai ulang — lihat komentar di env.js.
  deleteDead: (revokedGraceMinutes) => {
    const now = new Date();
    const graceCutoff = new Date(now.getTime() - revokedGraceMinutes * 60 * 1000);
    return prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: graceCutoff } }],
      },
    });
  },
};
