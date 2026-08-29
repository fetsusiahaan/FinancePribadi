import { prisma } from "../config/db.js";

export const sharedFinanceInvitationRepository = {
  // Undangan aktif terbaru. Undangan lama tidak dihapus saat dirotasi (dicabut
  // dengan revokedAt) supaya jejak "kode ini pernah dipakai berapa kali" tetap ada.
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
};
