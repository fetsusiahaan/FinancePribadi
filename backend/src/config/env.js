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
  return { active, url: forRuntime(url) };
}

// --- Pooler runtime ---------------------------------------------------------
//
// URL di .env memakai port 5432 (SESSION pooler) karena itu yang bisa dipakai
// psql -- restore-db.ps1 bergantung padanya, dan slot yang tidak bisa direstore
// bukan standby (lihat FAILOVER.md). Tapi session pooler memberi SATU koneksi
// Postgres per klien selama klien itu hidup, dengan plafon 15. Prisma menahan
// poolnya, jadi satu-dua instance backend saja sudah menghabiskannya dan
// koneksi berikutnya ditolak:
//
//   FATAL: (EMAXCONNSESSION) max clients reached ... pool_size: 15
//
// Gejalanya menyesatkan: proses yang SEDANG jalan tetap sehat (koneksinya sudah
// terbuka) sementara setiap koneksi BARU gagal, jadi /health menjawab 200
// seolah database baik-baik saja sementara request pengguna jadi 500.
// Menurunkan connection_limit hanya menggeser batasnya, tidak menghilangkannya.
//
// Port 6543 (TRANSACTION pooler) memakai koneksi bergantian per transaksi, dan
// plafonnya ratusan. Itu yang dipakai APLIKASI. Yang tetap di 5432:
//   - Prisma CLI (migrate/studio/db pull) -- membaca DATABASE_URL dari .env
//     langsung dan tidak menjalankan berkas ini. `migrate` WAJIB lewat session
//     pooler; DDL-nya butuh sesi yang menetap.
//   - restore-db.ps1 (psql), yang menolak query param `pgbouncer` mentah-mentah.
//
// Jadi pemisahannya bukan gaya penulisan: satu port untuk lalu lintas request,
// satu port untuk perkakas yang butuh sesi utuh.
const SESSION_POOLER_PORT = "5432";
const TRANSACTION_POOLER_PORT = "6543";

// Prisma harus tahu ia bicara dengan pgbouncer: tanpa ini ia memakai prepared
// statement bernama, yang tidak bertahan saat koneksi dipindah antar transaksi.
// Kegagalannya acak dan menyesatkan ("prepared statement s0 already exists"),
// bukan error saat start.
const PGBOUNCER_FLAG = "pgbouncer";

// Batas pool tetap dipasang meski plafon transaction pooler jauh lebih longgar:
// ia jadi pagar kalau suatu saat URL menunjuk balik ke session pooler, dan
// mencegah satu instance membuka koneksi tak terbatas saat lonjakan.
const DEFAULT_CONNECTION_LIMIT = 8;
// Antre menunggu koneksi kosong, bukan langsung gagal. Lonjakan sesaat lebih
// baik jadi request yang lambat daripada 500 ke pengguna.
const DEFAULT_POOL_TIMEOUT = 20;

/**
 * Ubah URL dari .env menjadi URL yang dipakai proses ini.
 *
 * Ditaruh di kode, bukan diketik di tiap DATABASE_URL_n, karena .env harus
 * tetap berisi URL yang bisa dipakai psql apa adanya. Menaruh `pgbouncer=true`
 * di sana akan mematahkan restore-db.ps1 -- persis jebakan yang sudah dicatat
 * di FAILOVER.md.
 *
 * Nilai yang SUDAH disebut di URL tidak ditimpa, termasuk portnya: slot yang
 * memang perlu port lain (Neon tidak punya pooler Supabase) tetap apa adanya.
 */
function forRuntime(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    // URL tak terbaca dibiarkan apa adanya: kegagalannya harus datang dari
    // Prisma dengan pesannya sendiri, bukan dari pemasangan query param di sini.
    return rawUrl;
  }

  // Hanya pooler Supabase yang punya pasangan port 5432/6543. Provider lain
  // (Neon di slot 3) tidak, dan memindahkan portnya akan menunjuk ke ketiadaan.
  const isSupabasePooler = parsed.hostname.endsWith(".pooler.supabase.com");
  if (isSupabasePooler && parsed.port === SESSION_POOLER_PORT) {
    parsed.port = TRANSACTION_POOLER_PORT;
    parsed.searchParams.set(PGBOUNCER_FLAG, "true");
  }

  if (!parsed.searchParams.has("connection_limit")) {
    parsed.searchParams.set("connection_limit", String(DEFAULT_CONNECTION_LIMIT));
  }
  if (!parsed.searchParams.has("pool_timeout")) {
    parsed.searchParams.set("pool_timeout", String(DEFAULT_POOL_TIMEOUT));
  }
  return parsed.toString();
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
