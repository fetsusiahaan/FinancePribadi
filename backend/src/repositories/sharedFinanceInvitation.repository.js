import { prisma } from "../config/db.js";

export const sharedFinanceInvitationRepository = {
  // Undangan aktif terbaru. Undangan yang DIROTASI tidak dihapus (dicabut
  // dengan revokedAt) supaya jejak "kode ini pernah dipakai berapa kali" tetap
  // ada. Yang KEDALUWARSA dihapus -- lihat deleteExpired di bawah.
  findCurrent: (sharedFinanceId) =>
    prisma.sharedFinanceInvitation.findFirst({
      where: { sharedFinanceId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    }),

  findByCode: (code, client = prisma) =>
    client.sharedFinanceInvitation.findUnique({
      where: { code },
      include: { sharedFinance: true },
    }),

  findById: (id, sharedFinanceId) =>
    prisma.sharedFinanceInvitation.findFirst({ where: { id, sharedFinanceId } }),

  create: (data) => prisma.sharedFinanceInvitation.create({ data }),

  revoke: (id) =>
    prisma.sharedFinanceInvitation.update({ where: { id }, data: { revokedAt: new Date() } }),

  revokeAllFor: (sharedFinanceId) =>
    prisma.sharedFinanceInvitation.updateMany({
      where: { sharedFinanceId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),

  // Increment atomik di dalam transaksi join. `increment` dipakai, bukan
  // membaca-lalu-menulis, supaya dua orang yang memakai kode yang sama pada
  // saat bersamaan tidak saling menimpa hitungannya.
  incrementUse: (id, client = prisma) =>
    client.sharedFinanceInvitation.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    }),

  // Buang undangan yang masa berlakunya sudah lewat, untuk SEMUA ruang.
  // Balikannya { count } dari Prisma.
  //
  // `expiresAt: null` berarti tidak pernah kedaluwarsa (issue() menulis null
  // saat expires_in_minutes <= 0). Perbandingan `lt` di Prisma tidak pernah
  // cocok dengan NULL, jadi baris itu aman -- tapi ini ditulis di sini supaya
  // tidak ada yang "merapikan" filternya jadi sesuatu yang ikut menyapu.
  deleteExpired: (client = prisma) =>
    client.sharedFinanceInvitation.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),

  // Versi satu ruang, dipakai saat kedaluwarsanya ketahuan di jalur request
  // (getCurrent) supaya penghapusannya tidak menunggu sapuan berikutnya.
  deleteExpiredFor: (sharedFinanceId, client = prisma) =>
    client.sharedFinanceInvitation.deleteMany({
      where: { sharedFinanceId, expiresAt: { lt: new Date() } },
    }),
};
