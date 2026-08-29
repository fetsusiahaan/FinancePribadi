import { refreshTokenRepository } from "../repositories/refreshToken.repository.js";
import { env } from "../config/env.js";



// Kapan sapuan terakhir DIMULAI, bukan selesai. Menandai di awal supaya dua
// request /health yang datang nyaris bersamaan tidak dua-duanya lolos jeda.
let lastSweepAt = 0;


let sweeping = false;

// Diekspos untuk pengujian: memastikan jeda benar-benar menahan sapuan kedua
// tanpa harus menunggu satu jam sungguhan.
export function _resetCleanupState() {
  lastSweepAt = 0;
  sweeping = false;
}


export function maybeCleanupRefreshTokens() {
  if (sweeping) return;

  const intervalMs = env.refreshTokenCleanupIntervalMinutes * 60 * 1000;
  const now = Date.now();
  if (now - lastSweepAt < intervalMs) return;

  lastSweepAt = now;
  sweeping = true;

  refreshTokenRepository
    .deleteDead(env.refreshTokenRevokedGraceDays)
    .then((result) => {
      // Hanya dicatat kalau ada yang terhapus: sapuan kosong adalah keadaan
      // normal dan mayoritas, mencatatnya cuma membanjiri log.
      if (result.count > 0) {
        console.log(`[cleanup] refresh_tokens: ${result.count} baris mati dihapus`);
      }
    })
    .catch((err) => {
      console.error("[cleanup] refresh_tokens gagal:", err.message);
    })
    .finally(() => {
      sweeping = false;
    });
}
