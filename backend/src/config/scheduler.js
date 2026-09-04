import { runPlanExpiryNotifications } from "../services/plan.notifier.service.js";
import { logBackend } from "../utils/logger.js";
import { PLAN_SWEEP_INTERVAL_MINUTES } from "../services/plan.constants.js";

/**
 * Penjadwal dalam proses. Satu-satunya di project ini.
 *
 * KENAPA BUKAN DIBONCENG /health seperti cleanup.service.js:
 *
 * Pembersih di cleanup.service.js sengaja menumpang GET /health, dan komentar di
 * sana mengakui konsekuensinya: "kalau tidak ada klien yang hidup, pembersihan
 * tidak jalan". Untuk membuang baris mati itu tidak apa-apa -- pekerjaannya
 * cuma tertunda, dan yang menunda tidak dirugikan.
 *
 * Di sini justru sebaliknya. Yang dikerjakan adalah memberi tahu orang yang
 * SEDANG TIDAK membuka aplikasi bahwa PREMIUM-nya akan habis. Menggantungkannya
 * pada adanya klien aktif berarti peringatan hanya sampai ke orang yang toh
 * sedang membuka aplikasi -- tepat orang yang paling tidak membutuhkannya.
 *
 * KENAPA setInterval, BUKAN node-cron:
 *
 * Yang dibutuhkan cuma "tiap sekian jam", bukan ekspresi kalender. setInterval
 * sudah memenuhinya tanpa menambah dependensi.
 *
 * KENAPA BUKAN cron sistem (crontab / Task Scheduler / cron platform hosting):
 *
 * Itu memang lebih benar untuk banyak instance, dan inilah batas yang harus
 * dipegang: penjadwal ini hidup DI DALAM proses server. Menjalankan dua instance
 * backend berarti dua penjadwal, dan keduanya bisa mengirim notifikasi yang sama
 * dalam sapuan yang bersamaan. Untuk satu instance -- keadaan project ini
 * sekarang -- ini benar. Kalau nanti berskala lebih dari satu proses, pindahkan
 * pemanggilan runPlanExpiryNotifications() ke cron eksternal yang menembak satu
 * endpoint internal, dan matikan penjadwal ini.
 */

let timer = null;

// unref() supaya timer tidak menahan proses tetap hidup. Tanpa ini, `node
// server.js` tidak pernah bisa berhenti sendiri dan Ctrl+C di dev terasa
// menggantung sampai interval berikutnya.
function schedule(fn, intervalMs) {
  const t = setInterval(fn, intervalMs);
  if (typeof t.unref === "function") t.unref();
  return t;
}

let running = false;

async function sweep() {
  // Sapuan sebelumnya belum selesai (DB lambat, daftar panjang) -- lewati saja.
  // Tanpa penjaga ini dua sapuan bisa berjalan bersamaan dan mengirim
  // notifikasi yang sama dua kali, karena penanda baru ditulis di akhir.
  if (running) return;
  running = true;
  try {
    const { warned, expired } = await runPlanExpiryNotifications();
    if (warned || expired) {
      logBackend(`Plan sweep: ${warned} peringatan, ${expired} pemberitahuan berakhir`);
    }
  } catch (err) {
    // Ditelan, sama seperti cleanup.service.js: penjadwal yang melempar akan
    // memunculkan unhandled rejection dan, tergantung versi Node, menjatuhkan
    // seluruh server gara-gara notifikasi yang gagal.
    logBackend(`Plan sweep gagal: ${err.message}`, true);
  } finally {
    running = false;
  }
}

export function startScheduler() {
  if (timer) return; // idempoten -- `node --watch` bisa mengeksekusi ini dua kali
  const intervalMs = PLAN_SWEEP_INTERVAL_MINUTES * 60 * 1000;

  // TIDAK disapu saat boot. Restart yang sering -- deploy, `node --watch` di
  // dev, container yang di-restart -- akan berarti sapuan tiap kali start, dan
  // itu bukan masalah untuk notifikasinya (penanda mencegah kiriman ganda) tapi
  // membuat pengujian sulit dipercaya. Sapuan pertama datang satu interval
  // setelah server hidup.
  timer = schedule(sweep, intervalMs);
  logBackend(`Scheduler aktif: sapuan tier tiap ${PLAN_SWEEP_INTERVAL_MINUTES} menit`);
}

export function stopScheduler() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
