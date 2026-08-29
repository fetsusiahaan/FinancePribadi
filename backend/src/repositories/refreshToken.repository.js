import { prisma } from "../config/db.js";

export const refreshTokenRepository = {
  create: (data) => prisma.refreshToken.create({ data }),
  findValidByHash: (tokenHash) =>
    prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  findByHash: (tokenHash) => prisma.refreshToken.findUnique({ where: { tokenHash } }),
  revoke: (id) => prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }),

  
  deleteDead: (revokedGraceDays) => {
    const now = new Date();
    const graceCutoff = new Date(now.getTime() - revokedGraceDays * 24 * 60 * 60 * 1000);
    return prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: graceCutoff } }],
      },
    });
  },
};
