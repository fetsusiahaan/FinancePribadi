import { prisma } from "../config/db.js";

export const refreshTokenRepository = {
  create: (data) => prisma.refreshToken.create({ data }),
  findValidByHash: (tokenHash) =>
    prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  findByHash: (tokenHash) => prisma.refreshToken.findUnique({ where: { tokenHash } }),
  revoke: (id) => prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }),
};
