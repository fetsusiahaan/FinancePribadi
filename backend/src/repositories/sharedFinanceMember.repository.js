import { prisma } from "../config/db.js";

// Beberapa fungsi di sini menerima parameter terakhir `client = prisma`.
//
// Itu supaya fungsi yang sama bisa dipakai DI DALAM prisma.$transaction(async
// (tx) => ...) — transfer ownership dan join wajib atomik, dan klien transaksi
// tidak bisa diambil dari singleton. Defaultnya singleton, jadi seluruh pemanggil
// non-transaksional tetap memanggilnya seperti biasa.
//
// Ini transaksi INTERAKTIF pertama di codebase ini (satu-satunya $transaction
// lain, di transaction.repository.js, adalah bentuk array). Jangan "dirapikan"
// dengan membuang parameter itu — atomicity-nya bergantung padanya.
export const sharedFinanceMemberRepository = {
  // Dipakai guard requireMembership: satu-satunya lookup per request.
  // `sharedFinance` ikut di-include supaya requireNotArchived tidak perlu query
  // kedua.
  findActive: (sharedFinanceId, userId) =>
    prisma.sharedFinanceMember.findFirst({
      where: { sharedFinanceId, userId, status: "ACTIVE" },
      include: { sharedFinance: true },
    }),

  findActiveTx: (sharedFinanceId, userId, client = prisma) =>
    client.sharedFinanceMember.findFirst({
      where: { sharedFinanceId, userId, status: "ACTIVE" },
    }),

  findAnyTx: (sharedFinanceId, userId, client = prisma) =>
    client.sharedFinanceMember.findFirst({ where: { sharedFinanceId, userId } }),

  findById: (id, sharedFinanceId) =>
    prisma.sharedFinanceMember.findFirst({
      where: { id, sharedFinanceId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    }),

  list: (sharedFinanceId, { includeInactive = false } = {}) =>
    prisma.sharedFinanceMember.findMany({
      where: { sharedFinanceId, ...(includeInactive ? {} : { status: "ACTIVE" }) },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      // role ascending: "MEMBER" < "OWNER" secara alfabet, jadi diurutkan
      // menurun supaya OWNER muncul paling atas seperti mockup PRD §9.
      orderBy: [{ role: "desc" }, { joinedAt: "asc" }],
    }),

  countActive: (sharedFinanceId, client = prisma) =>
    client.sharedFinanceMember.count({ where: { sharedFinanceId, status: "ACTIVE" } }),

  findOwner: (sharedFinanceId, client = prisma) =>
    client.sharedFinanceMember.findFirst({
      where: { sharedFinanceId, role: "OWNER", status: "ACTIVE" },
      include: { user: { select: { id: true, name: true } } },
    }),

  setRole: (id, role, client = prisma) =>
    client.sharedFinanceMember.update({ where: { id }, data: { role } }),

  create: (data, client = prisma) => client.sharedFinanceMember.create({ data }),

  update: (id, data, client = prisma) =>
    client.sharedFinanceMember.update({ where: { id }, data }),

  // Penutupan LUNAK, bukan hapus baris: transaksi yang pernah dicatat anggota
  // itu harus tetap bisa diatribusikan, dan barisnya sekaligus jadi riwayat
  // keanggotaan yang tidak ikut tersapu retensi activity_logs.
  close: (id, status, client = prisma) =>
    client.sharedFinanceMember.update({
      where: { id },
      data: { status, leftAt: new Date() },
    }),
};
