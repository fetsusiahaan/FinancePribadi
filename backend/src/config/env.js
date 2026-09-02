import "dotenv/config";

// --- Pemilihan database -----------------------------------------------------
// Tiga URL tersedia di .env, SATU yang dipakai. DATABASE_ACTIVE menentukan
// yang mana. Ini failover manual, bukan load balance: alasannya di FAILOVER.md.
//
// Divalidasi di sini, saat proses start, BUKAN dibiarkan gagal di query
// pertama. Bedanya nyata: DATABASE_ACTIVE=2 dengan slot kosong akan membuat
// Prisma menyambung ke string kosong dan errornya muncul sebagai kegagalan
// query di request acak beberapa menit kemudian -- tepat saat failover, tepat
// saat paling tidak ada waktu untuk menebak.
const DB_SLOTS = ["1", "2", "3"];

function resolveDatabaseUrl() {
  const active = String(process.env.DATABASE_ACTIVE ?? "1").trim();

  if (!DB_SLOTS.includes(active)) {
    throw new Error(
      `DATABASE_ACTIVE="${active}" tidak valid. Isi dengan 1, 2, atau 3 (lihat backend/.env).`
    );
  }

  const url = (process.env[`DATABASE_URL_${active}`] || "").trim();
  if (!url) {
    throw new Error(
      `DATABASE_ACTIVE=${active} tapi DATABASE_URL_${active} kosong di .env. ` +
        `Isi slot itu dulu, atau tunjuk slot lain.`
    );
  }

  // Slot lain yang terisi dengan URL yang sama tidak diperiksa: menyalin URL
  // yang sama ke dua slot memang tidak berbahaya (tetap satu database), cuma
  // membuat failover ke slot itu tidak menolong apa-apa.
  return { active, url };
}

const database = resolveDatabaseUrl();

// Prisma membaca env("DATABASE_URL") dari process.env, jadi hasil pilihan di
// atas ditimpakan ke sana. Ini WAJIB berjalan sebelum PrismaClient dibuat --
// config/db.js mengimpor modul ini lebih dulu untuk memastikan urutannya.
//
// Baris DATABASE_URL di .env sengaja tetap ada dan tetap dipakai apa adanya
// oleh Prisma CLI (migrate/studio/db pull), yang tidak menjalankan kode kita.
process.env.DATABASE_URL = database.url;

/** Host saja, tanpa kredensial -- aman untuk log dan panel admin. */
export function activeDbHost() {
  const m = database.url.match(/@([^/:?]+)/);
  return m ? m[1] : "(tidak terbaca)";
}

export const env = {
  databaseSlot: database.active,
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30,
  
  // Jarak minimum antar-sapuan pembersih (refresh_tokens + activity_logs).
  // Pembersihnya dibonceng GET /health, yang di-ping tiap 45 detik per klien —
  // tanpa jeda ini satu perangkat aktif saja sudah memicu ribuan DELETE
  // per hari.
  //
  // Ini yang menentukan seberapa cepat baris mati benar-benar hilang, bukan
  // masa tenggang di bawah. Tenggang 1 menit dengan sapuan tiap 60 menit tetap
  // berarti menunggu satu jam. Angka-angka ini harus dipilih bersama.
  cleanupIntervalMinutes:
    Number(process.env.CLEANUP_INTERVAL_MINUTES ?? process.env.REFRESH_TOKEN_CLEANUP_INTERVAL_MINUTES) ||
    5,
  
  
  refreshTokenRevokedGraceMinutes:
    Number(process.env.REFRESH_TOKEN_REVOKED_GRACE_MINUTES ?? 30),
  // Umur maksimum baris activity_logs. Lewat itu dihapus permanen oleh
  // pembersih yang sama di GET /health.
  //
  // Ini kebijakan retensi audit, bukan sekadar housekeeping seperti
  // refresh_tokens: baris yang dibuang di sini masih SAH dan masih terbaca di
  // panel admin sampai detik penghapusannya. Menaikkan angkanya tidak
  // mengembalikan yang sudah hilang.
  activityLogRetentionDays: Number(process.env.ACTIVITY_LOG_RETENTION_DAYS) || 5,
  totpIssuer: process.env.TOTP_ISSUER || "Finetra AI",
  googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
  firebaseServiceAccount: (() => {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
    if (!b64) return null;
    try {
      return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    } catch {
      return null;
    }
  })(),
};
