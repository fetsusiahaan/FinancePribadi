import { prisma } from "../config/db.js";

export const userPlanRepository = {
  findByUserId: (userId) => prisma.userPlan.findUnique({ where: { userId } }),

  // SATU-SATUNYA jalan tulis ke user_plans dan plan_grants. Keduanya diubah di
  // dalam satu transaksi supaya baris aktif dan riwayatnya tidak pernah bisa
  // berbeda cerita; menulis salah satunya saja akan diam-diam merusak audit.
  setTier: (userId, { tier, expiresAt = null, grantedById = null, note = null }, now = new Date()) =>
    prisma.$transaction([
      prisma.userPlan.upsert({
        where: { userId },
        create: { userId, tier, startsAt: now, expiresAt },
        update: { tier, startsAt: now, expiresAt },
      }),
      prisma.planGrant.create({
        data: { userId, tier, startsAt: now, expiresAt, grantedById, note },
      }),
    ]),

  listGrants: (userId, take = 50) =>
    prisma.planGrant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      include: { grantedBy: { select: { id: true, name: true, email: true } } },
    }),

  // --- Dipakai penjadwal (plan.notifier.service.js) -------------------------
  //
  // Penyaringan penanda ("sudah pernah dikirim untuk tanggal ini?") TIDAK
  // dikerjakan di SQL. Perbandingan antar-kolom butuh field reference Prisma,
  // dan kolom waktu di sini digeser 7 jam oleh extension di config/timezone.js;
  // menaruh perbandingan itu di dalam `where` berarti mengandalkan pergeseran
  // yang benar pada dua sisi sekaligus, dan salahnya tidak akan berupa error --
  // cuma notifikasi yang diam. Jadi yang di-query hanya kandidat berdasarkan
  // rentang tanggal, dan pencocokan penanda dilakukan di JS oleh pemanggil.
  //
  // Jumlah barisnya kecil menurut definisi: hanya PREMIUM yang habis dalam
  // rentang sempit, bukan seluruh tabel.

  // PREMIUM yang akan habis dalam rentang (now, until].
  findPremiumExpiringBetween: (now, until) =>
    prisma.userPlan.findMany({
      where: { tier: "PREMIUM", expiresAt: { gt: now, lte: until } },
      select: { id: true, userId: true, expiresAt: true, warnedFor: true },
    }),

  // PREMIUM yang sudah lewat. Barisnya TIDAK diubah tier-nya oleh penjadwal:
  // resolveTier() sudah membacanya sebagai FREE, dan menulis FREE ke sini akan
  // menghapus expiresAt yang masih dipakai premiumExpiryFrom() untuk menghitung
  // perpanjangan, sekaligus membuat plan_grants berisi pemberian yang tidak
  // pernah dilakukan siapa pun.
  //
  // `since` membatasi seberapa jauh ke belakang dicari, supaya akun yang habis
  // setahun lalu tidak ikut terbaca tiap siklus selamanya.
  findPremiumExpiredBetween: (since, now) =>
    prisma.userPlan.findMany({
      where: { tier: "PREMIUM", expiresAt: { gt: since, lte: now } },
      select: { id: true, userId: true, expiresAt: true, expiredNotifiedFor: true },
    }),

  // Penanda ditulis per baris karena nilainya berbeda per baris (masing-masing
  // expiresAt-nya sendiri) -- updateMany dengan satu tanggal akan menandai
  // sebagian orang untuk tanggal milik orang lain.
  //
  // Nilai yang ditulis adalah expiresAt yang BARU SAJA dibaca, bukan yang
  // terkini di DB. Kalau di sela pengiriman user memperpanjang, yang tercatat
  // adalah tanggal lama, sehingga peringatan untuk tanggal baru tetap akan
  // dikirim nanti. Itu yang diinginkan.
  markNotified: (rows, field) =>
    prisma.$transaction(
      rows.map((r) =>
        prisma.userPlan.update({ where: { id: r.id }, data: { [field]: r.expiresAt } })
      )
    ),

  // Daftar akun yang PERNAH di-grant, untuk halaman Subscription > Plans.
  //
  // Sumbernya user_plans, bukan users: yang dicari justru akun berbayar, dan
  // menyaringnya dari seluruh tabel users berarti memindai akun FREE yang
  // jumlahnya jauh lebih banyak hanya untuk membuangnya lagi.
  //
  // PREMIUM kedaluwarsa TETAP ikut terbawa. Barisnya masih ada, dan halaman itu
  // memang perlu menampilkannya -- resolveTier() yang menurunkannya jadi FREE
  // saat DTO dibentuk, bukan query ini.
  //
  // Urutan expiresAt menaik dengan null terakhir: yang paling dekat habis di
  // atas, LIFETIME (tanpa tanggal) di bawah. Itu urutan yang berguna untuk
  // pekerjaan sesungguhnya di halaman ini -- menagih perpanjangan.
  listGranted: ({ skip = 0, take = 20, tier = null } = {}) =>
    prisma.userPlan.findMany({
      where: tier ? { tier } : {},
      skip,
      take,
      orderBy: [{ expiresAt: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, email: true, isSuspended: true } },
      },
    }),

  countGranted: ({ tier = null } = {}) => prisma.userPlan.count({ where: tier ? { tier } : {} }),

  countByTier: () => prisma.userPlan.groupBy({ by: ["tier"], _count: { _all: true } }),

  countExpiredPremium: (now = new Date()) =>
    prisma.userPlan.count({ where: { tier: "PREMIUM", expiresAt: { lte: now } } }),
};
