import { prisma } from "../config/db.js";

export const userRepository = {
  findByEmail: (email) => {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    return prisma.user.findFirst({
      where: { email: { equals: normalized, mode: "insensitive" } },
    });
  },
  findByGoogleId: (googleId) => prisma.user.findUnique({ where: { googleId } }),
  // `plan` ikut karena hampir semua pemanggil findById berakhir di toDto(), yang
  // wajib melaporkan tier. Barisnya kecil dan berelasi 1:1, tidak seperti kolom
  // `avatar` yang justru harus dijauhkan dari jalur ini.
  findById: (id) => prisma.user.findUnique({ where: { id }, include: { plan: true } }),

  // Dipisah dari findById: kolom `avatar` bisa berukuran belasan MB, jadi ia
  // tidak boleh ikut terangkut di jalur yang cuma butuh profil/role. Dua query
  // kecil jauh lebih murah daripada satu query yang selalu menyeret blob.
  findAvatarById: (id) =>
    prisma.user.findUnique({ where: { id }, select: { avatar: true, updatedAt: true } }),
  create: (data) =>
    prisma.user.create({
      data: {
        ...data,
        email: data.email ? data.email.trim().toLowerCase() : data.email,
      },
    }),
  update: (id, data) =>
    prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
      },
    }),
  remove: (id) => prisma.user.delete({ where: { id } }),

  findAllPaginated: ({ skip, take, search }) => {
    const where = search
      ? { OR: [{ email: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] }
      : {};
    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
        financialScore: true,
        createdAt: true,
        plan: { select: { tier: true, expiresAt: true } },
      },
    });
  },

  count: ({ search } = {}) => {
    const where = search
      ? { OR: [{ email: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] }
      : {};
    return prisma.user.count({ where });
  },

  countByRole: (role) => prisma.user.count({ where: { role } }),
  countBySuspended: (isSuspended) => prisma.user.count({ where: { isSuspended } }),
  countCreatedBetween: (start, end) => prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
};
