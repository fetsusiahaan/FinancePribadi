import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { prisma } from "./src/config/db.js";
import { startScheduler, stopScheduler } from "./src/config/scheduler.js";

const server = app.listen(env.port, () => {
  console.log(`API server running on http://localhost:${env.port}`);
  // Dinyalakan di sini, bukan di app.js: app.js juga di-import oleh pengujian
  // dan oleh alat yang cuma butuh route-nya, dan tak satu pun dari mereka boleh
  // ikut mengirim notifikasi ke perangkat sungguhan.
  startScheduler();
});

/**
 * Tutup koneksi database sebelum proses berakhir.
 *
 * Tanpa ini, proses yang mati meninggalkan sesinya menganggur di pooler
 * Supabase -- sesi yatim: tidak ada lagi proses yang memilikinya, tapi masih
 * dihitung terhadap plafon 15. Beberapa kali restart beruntun cukup untuk
 * menghabiskan seluruh jatah, dan gejalanya menyesatkan karena backend yang
 * SEDANG jalan tetap sehat (koneksinya sudah terbuka) sementara setiap koneksi
 * BARU ditolak "(EMAXCONNSESSION) max clients reached".
 *
 * `once`, bukan `on`: Ctrl+C dua kali tidak boleh memicu penutupan ganda.
 */
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} diterima, menutup...`);

  stopScheduler();
  // Berhenti menerima request baru dulu, baru lepas database -- urutan
  // sebaliknya membuat request yang masih berjalan gagal di tengah jalan.
  server.close();

  try {
    await prisma.$disconnect();
    console.log("[server] koneksi database dilepas");
  } catch (err) {
    console.error(`[server] gagal melepas koneksi: ${err.message}`);
  }
  process.exit(0);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => shutdown(signal));
}
