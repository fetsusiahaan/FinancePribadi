import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { startScheduler } from "./src/config/scheduler.js";

app.listen(env.port, () => {
  console.log(`API server running on http://localhost:${env.port}`);
  // Dinyalakan di sini, bukan di app.js: app.js juga di-import oleh pengujian
  // dan oleh alat yang cuma butuh route-nya, dan tak satu pun dari mereka boleh
  // ikut mengirim notifikasi ke perangkat sungguhan.
  startScheduler();
});
