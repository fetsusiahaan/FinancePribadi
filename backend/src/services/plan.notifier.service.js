import { userPlanRepository } from "../repositories/userPlan.repository.js";
import { sendToUsers } from "./pushNotification.service.js";
import { PREMIUM_WARN_DAYS, EXPIRED_LOOKBACK_DAYS } from "./plan.constants.js";

/**
 * Pemberitahuan kedaluwarsa PREMIUM.
 *
 * KENAPA INI ADA, padahal resolveTier() sudah menangani kedaluwarsa:
 * resolveTier() benar, tapi diam. Tanpa berkas ini, PREMIUM yang habis tidak
 * memberi kabar apa pun -- user hanya menemukan tiernya sudah FREE, biasanya
 * saat sedang memakai fitur. Yang dikerjakan di sini murni PEMBERITAHUAN;
 * penentuan tier tetap sepenuhnya milik resolveTier().
 *
 * Karena itu berkas ini TIDAK PERNAH mengubah kolom `tier`. Satu-satunya yang
 * ditulisnya adalah dua kolom penanda kirim. Kalau suatu hari ia berhenti
 * berjalan sama sekali, tidak ada satu pun tier yang salah -- yang hilang cuma
 * notifikasinya. Itu batas yang sengaja dijaga.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// Sudah dikirim untuk tanggal habis yang SAMA? Perbandingan pakai getTime()
// karena dua Date dengan isi sama tetap dua objek berbeda; `===` di sini akan
// selalu false dan setiap siklus mengirim ulang notifikasi yang sama.
const alreadySent = (mark, expiresAt) =>
  mark instanceof Date && expiresAt instanceof Date && mark.getTime() === expiresAt.getTime();

const daysLeft = (expiresAt, now) => Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS));

/**
 * Satu sapuan. Mengembalikan hitungan supaya bisa diuji dan dicatat, bukan void.
 *
 * `now` bisa disuntik demi pengujian; produksi selalu memakai waktu nyata.
 */
export async function runPlanExpiryNotifications(now = new Date()) {
  const warnUntil = new Date(now.getTime() + PREMIUM_WARN_DAYS * DAY_MS);
  const expiredSince = new Date(now.getTime() - EXPIRED_LOOKBACK_DAYS * DAY_MS);

  const [expiringRows, expiredRows] = await Promise.all([
    userPlanRepository.findPremiumExpiringBetween(now, warnUntil),
    userPlanRepository.findPremiumExpiredBetween(expiredSince, now),
  ]);

  const expiring = expiringRows.filter((r) => r.expiresAt && !alreadySent(r.warnedFor, r.expiresAt));
  const expired = expiredRows.filter(
    (r) => r.expiresAt && !alreadySent(r.expiredNotifiedFor, r.expiresAt)
  );

  // Push dikirim per baris, bukan satu sendToUsers untuk semua: isi pesannya
  // berbeda per user (sisa harinya tidak sama), jadi menggabungkannya justru
  // akan mengirim angka milik orang lain.
  //
  // Penanda ditulis SETELAH pengiriman, dan sendToUsers tidak pernah melempar
  // (errornya ditelan di dalam). Konsekuensinya dipegang sadar: kalau FCM
  // sedang mati, notifikasinya hilang dan tetap ditandai terkirim. Alternatifnya
  // -- menandai hanya saat sukses -- membuat gangguan FCM berubah menjadi banjir
  // notifikasi berulang ke semua orang begitu FCM pulih. Notifikasi yang hilang
  // lebih ringan daripada notifikasi yang berkali-kali.
  for (const row of expiring) {
    await sendToUsers([row.userId], {
      type: "plan_expiring",
      days_left: daysLeft(row.expiresAt, now),
      expires_at: row.expiresAt.toISOString(),
    });
  }

  for (const row of expired) {
    await sendToUsers([row.userId], {
      type: "plan_expired",
      expires_at: row.expiresAt.toISOString(),
    });
  }

  if (expiring.length) await userPlanRepository.markNotified(expiring, "warnedFor");
  if (expired.length) await userPlanRepository.markNotified(expired, "expiredNotifiedFor");

  return { warned: expiring.length, expired: expired.length };
}
