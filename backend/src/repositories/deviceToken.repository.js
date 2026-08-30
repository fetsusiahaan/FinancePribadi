import { prisma } from "../config/db.js";

export const deviceTokenRepository = {
  upsert: (userId, token) =>
    prisma.deviceToken.upsert({
      where: { token },
      update: { userId, lastSeenAt: new Date() },
      create: { userId, token },
    }),

  deleteByToken: (token) =>
    prisma.deviceToken.deleteMany({
      where: { token },
    }),

  deleteByTokens: (tokens) =>
    prisma.deviceToken.deleteMany({
      where: { token: { in: tokens } },
    }),

  listTokensForUsers: (userIds) =>
    prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    }),
};
