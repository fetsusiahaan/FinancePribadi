// Self-check penjadwal notifikasi tier. Jalankan: node src/tests/planNotifier.test.js
//
// Repository dan pengirim push diganti tiruan, jadi tidak menyentuh DB maupun
// FCM. Yang diuji adalah satu-satunya bagian yang bisa salah diam-diam:
// pencocokan penanda "sudah dikirim".
import assert from "node:assert/strict";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-06-15T00:00:00Z");

// --- Tiruan ----------------------------------------------------------------

const marked = [];
let expiringRows = [];
let expiredRows = [];

const { userPlanRepository } = await import("../repositories/userPlan.repository.js");
const pushModule = await import("../services/pushNotification.service.js");

userPlanRepository.findPremiumExpiringBetween = async () => expiringRows;
userPlanRepository.findPremiumExpiredBetween = async () => expiredRows;
userPlanRepository.markNotified = async (rows, field) => marked.push({ field, ids: rows.map((r) => r.id) });

// sendToUsers TIDAK ditiru: binding modul ESM tidak bisa ditimpa dari luar.
// Pemanggilan aslinya aman di sini karena getFirebaseApp() mengembalikan null
// tanpa kredensial, dan sendToUsers langsung keluar (lihat baris 8 di berkas
// itu) -- tidak ada jaringan, tidak ada DB. Yang diperiksa di bawah karenanya
// bukan isi pesannya, melainkan BARIS MANA yang lolos saringan penanda: itulah
// satu-satunya bagian yang bisa salah tanpa menimbulkan error.
assert.equal(typeof pushModule.sendToUsers, "function");

const { runPlanExpiryNotifications } = await import("../services/plan.notifier.service.js");

const reset = () => {
  marked.length = 0;
  expiringRows = [];
  expiredRows = [];
};

// --- Kasus -----------------------------------------------------------------

// Belum pernah diberitahu: masuk hitungan.
reset();
expiringRows = [{ id: "a", userId: "u1", expiresAt: new Date(now.getTime() + 2 * DAY), warnedFor: null }];
let res = await runPlanExpiryNotifications(now);
assert.equal(res.warned, 1);
assert.deepEqual(marked, [{ field: "warnedFor", ids: ["a"] }]);

// Sudah diberitahu untuk tanggal habis yang SAMA: dilewati.
// Ini inti berkas ini -- dua Date berisi sama adalah objek berbeda, jadi
// perbandingannya harus lewat getTime(). Kalau `===` yang dipakai, baris ini
// gagal dan produksi akan mengirim ulang tiap sapuan.
reset();
const exp = new Date(now.getTime() + 2 * DAY);
expiringRows = [{ id: "a", userId: "u1", expiresAt: exp, warnedFor: new Date(exp.getTime()) }];
res = await runPlanExpiryNotifications(now);
assert.equal(res.warned, 0);
assert.deepEqual(marked, []);

// Diperpanjang setelah diperingatkan: expiresAt berubah, penanda lama tidak
// cocok lagi, peringatan siklus BARU aktif kembali tanpa ada yang mereset.
reset();
expiringRows = [
  {
    id: "a",
    userId: "u1",
    expiresAt: new Date(now.getTime() + 2 * DAY),
    warnedFor: new Date(now.getTime() - 28 * DAY),
  },
];
res = await runPlanExpiryNotifications(now);
assert.equal(res.warned, 1);

// Sudah habis dan belum dikabari: masuk hitungan kedaluwarsa, ditandai di kolom
// yang berbeda dari peringatan.
reset();
expiredRows = [
  { id: "b", userId: "u2", expiresAt: new Date(now.getTime() - 1 * DAY), expiredNotifiedFor: null },
];
res = await runPlanExpiryNotifications(now);
assert.equal(res.expired, 1);
assert.deepEqual(marked, [{ field: "expiredNotifiedFor", ids: ["b"] }]);

// Penanda peringatan TIDAK ikut menghitung sebagai penanda kedaluwarsa: user
// yang sudah diperingatkan tetap harus dikabari saat benar-benar habis.
reset();
const exp2 = new Date(now.getTime() - 1 * DAY);
expiredRows = [{ id: "b", userId: "u2", expiresAt: exp2, expiredNotifiedFor: null, warnedFor: exp2 }];
res = await runPlanExpiryNotifications(now);
assert.equal(res.expired, 1);

// Baris tanpa expiresAt tidak pernah diproses -- tidak seharusnya ada untuk
// PREMIUM, tapi kalau ada, .toISOString() padanya akan melempar.
reset();
expiringRows = [{ id: "c", userId: "u3", expiresAt: null, warnedFor: null }];
res = await runPlanExpiryNotifications(now);
assert.equal(res.warned, 0);

// Tidak ada yang perlu dikirim: tidak ada penulisan penanda sama sekali.
reset();
res = await runPlanExpiryNotifications(now);
assert.deepEqual(res, { warned: 0, expired: 0 });
assert.deepEqual(marked, []);

console.log("planNotifier.test.js OK");
