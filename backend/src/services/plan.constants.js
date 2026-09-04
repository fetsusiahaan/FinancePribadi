// Katalog tier — sengaja konstanta di kode, bukan tabel katalog di DB.
// Limit yang bisa diubah lewat panel admin butuh UI, seeding, dan validasi
// runtime; sampai angkanya sendiri belum diputuskan, semua itu belum berguna.
//
// Tier di sini TIDAK ada hubungannya dengan UserRole (USER/ADMIN) maupun dengan
// SharedFinanceMember.role (OWNER/MEMBER). ADMIN bertier FREE tetap FREE.

export const TIER = { FREE: "FREE", PREMIUM: "PREMIUM", LIFETIME: "LIFETIME" };

export const TIER_VALUES = Object.values(TIER);

// Masa berlaku PREMIUM: 30 hari, dihitung server. Angka ini BUKAN nilai bawaan
// yang bisa ditimpa -- pemanggil tidak bisa mengirim tanggal habis sendiri, dan
// admin yang salah ketik tidak bisa diam-diam memberi PREMIUM sepuluh tahun.
//
// Dinyatakan dalam hari, bukan milidetik, supaya baris ini tetap terbaca sebagai
// aturan produk. Konversinya dikerjakan premiumExpiryFrom() di plan.service.js.
export const PREMIUM_DURATION_DAYS = 30;

// Berapa hari sebelum habis user diperingatkan. Satu peringatan per masa
// berlaku, bukan satu per hari: penandanya menyimpan tanggal habis yang sudah
// dikabari, jadi menaikkan angka ini memperpanjang jendelanya, tidak menambah
// jumlah pesan.
export const PREMIUM_WARN_DAYS = 3;

// Seberapa jauh ke belakang penjadwal mencari PREMIUM yang baru habis.
// Ada supaya akun yang habis setahun lalu tidak ikut terbaca tiap siklus
// selamanya; 7 hari cukup longgar untuk menutupi backend yang mati beberapa hari
// tanpa membuat pemberitahuan datang basi.
export const EXPIRED_LOOKBACK_DAYS = 7;

// Jarak antar-sapaan penjadwal, dalam menit. 6 jam: peringatan "3 hari lagi"
// tidak butuh ketelitian menit, dan sapuan yang jarang berarti lebih sedikit
// query ke database yang sama yang melayani request user.
export const PLAN_SWEEP_INTERVAL_MINUTES = 360;

// Batas per tier. `null` = tanpa batas.
//
// Sengaja MASIH KOSONG: penegakan limit belum dipasang di mana pun, dan angka
// karangan yang tidak pernah dipakai lebih berbahaya daripada tabel kosong --
// ia terlihat seperti aturan yang berlaku padahal tidak.
//
// Cara menambah: isi satu key di ketiga tier sekaligus, lalu panggil
// limitFor(tier, key) di titik pembuatan yang bersangkutan
// (transaction.service.js, budget.service.js, sharedFinance.service.js,
// exportData di user.controller.js).
export const TIER_LIMITS = {
  [TIER.FREE]: {},
  [TIER.PREMIUM]: {},
  [TIER.LIFETIME]: {},
};

// Key yang tidak terdaftar mengembalikan null (= tanpa batas), BUKAN 0.
// Salah ketik nama limit karena itu berakibat fitur terbuka, bukan fitur mati
// diam-diam bagi semua orang.
export const limitFor = (tier, key) => TIER_LIMITS[tier]?.[key] ?? null;
