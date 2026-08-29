import { refreshTokenRepository } from "../repositories/refreshToken.repository.js";
import { activityLogRepository } from "../repositories/activityLog.repository.js";
import { env } from "../config/env.js";

// Pembersih baris mati / kedaluwarsa, dibonceng GET /health.
//
// Menangani dua tabel dengan alasan berbeda:
// - refresh_tokens: baris yang sudah dicabut/kedaluwarsa. Sudah tidak bisa
//   dipakai login sebelum dihapus — penghapusannya murni soal ruang disk.
// - activity_logs: baris yang lebih tua dari retensi. Ini BEDA: log-nya masih
//   sah dan masih terbaca di panel admin sampai detik penghapusannya. Yang
//   membatasi cuma kebijakan umur, bukan status mati.
//
// Kenapa di /health dan bukan cron: tidak ada scheduler di project ini, dan
// /health adalah satu-satunya endpoint yang dipanggil berkala oleh klien tanpa
// perlu login. Konsekuensinya harus dipegang: kalau tidak ada klien yang
// hidup, pembersihan tidak jalan. Untuk refresh_tokens itu justru benar (tidak
// ada klien = tidak ada baris baru). Untuk activity_logs TIDAK sepenuhnya:
// backend yang lama menganggur tetap menyimpan log lama melewati batas
// retensinya, dan baru terpangkas saat ada klien menyapa lagi.
//
// Tiga aturan yang membuat ini tidak merusak /health:
//
// 1. TIDAK ditunggu. /health dijanjikan "tanpa DB call" (routes/index.js)
//    supaya tetap cepat saat DB lambat. Janji itu dipertahankan: sapuannya
//    dilepas tanpa await, respons tetap balas seketika.
// 2. Dijeda. /health di-ping tiap 45 detik per klien; tanpa jeda ini satu
//    perangkat saja sudah memicu ribuan DELETE sehari.
// 3. Errornya ditelan. Pembersihan adalah housekeeping — DB yang sedang
//    bermasalah tidak boleh membuat probe konektivitas ikut gagal, karena
//    klien akan salah menyimpulkan backend mati dan menampilkan layar offline.

// Kapan sapuan terakhir DIMULAI, bukan selesai. Menandai di awal supaya dua
// request /health yang datang nyaris bersamaan tidak dua-duanya lolos jeda.
let lastSweepAt = 0;

// Sapuan yang sedang jalan. Proses ini single-instance dan JS single-threaded,
// tapi sapuannya async: tanpa penanda ini, request kedua bisa masuk selagi
// DELETE pertama masih menunggu DB.
let sweeping = false;

// Diekspos untuk pengujian: memastikan jeda benar-benar menahan sapuan kedua
// tanpa harus menunggu intervalnya sungguhan.
export function _resetCleanupState() {
  lastSweepAt = 0;
  sweeping = false;
}

/**
 * Jalankan sapuan kalau jedanya sudah lewat. Fire-and-forget —
 * SENGAJA tidak mengembalikan promise supaya pemanggil di route tidak
 * tergoda meng-await-nya.
 */
export function maybeCleanup() {
  if (sweeping) return;

  const intervalMs = env.cleanupIntervalMinutes * 60 * 1000;
  const now = Date.now();
  if (now - lastSweepAt < intervalMs) return;

  lastSweepAt = now;
  sweeping = true;

  // allSettled, bukan all: satu tabel yang gagal tidak boleh membatalkan
  // pembersihan tabel lainnya — keduanya tidak saling bergantung.
  Promise.allSettled([
    refreshTokenRepository.deleteDead(env.refreshTokenRevokedGraceMinutes),
    activityLogRepository.deleteOlderThan(env.activityLogRetentionDays),
  ])
    .then(([tokens, logs]) => {
      report("refresh_tokens", tokens);
      report("activity_logs", logs);
    })
    .finally(() => {
      sweeping = false;
    });
}

function report(table, outcome) {
  if (outcome.status === "rejected") {
    console.error(`[cleanup] ${table} gagal:`, outcome.reason?.message || outcome.reason);
    return;
  }
  // Hanya dicatat kalau ada yang terhapus: sapuan kosong adalah keadaan normal
  // dan mayoritas, mencatatnya cuma membanjiri log.
  if (outcome.value.count > 0) {
    console.log(`[cleanup] ${table}: ${outcome.value.count} baris dihapus`);
  }
}
