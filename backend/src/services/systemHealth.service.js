import os from "os";
import { prisma } from "../config/db.js";
import { getSnapshot } from "../utils/metrics.js";

const NOT_INTEGRATED_SERVICES = [
  { key: "redis", label: "Redis" },
  { key: "queue", label: "Queue" },
  { key: "ai_service", label: "AI Service" },
  { key: "payment", label: "Payment" },
  { key: "email", label: "Email" },
  { key: "storage", label: "Storage" },
];

const EXTERNAL_SERVICES = [
  { key: "openai", label: "OpenAI" },
  { key: "google_ai", label: "Google AI" },
  { key: "anthropic", label: "Anthropic" },
  { key: "payment_gateway", label: "Payment Gateway" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
];

// Sebab kegagalan DB dalam bentuk yang aman ditampilkan.
//
// Pesan mentah Prisma TIDAK boleh diteruskan apa adanya: P1001 memuat host dan
// port database, P1000 memuat nama user. Yang dikirim keluar cuma kode error
// (P1001, P1002, ...) plus label yang sudah kita tulis sendiri -- itu sudah
// cukup buat membedakan penanganannya, dan tiga sebab di bawah ini butuh
// tindakan yang berbeda: kuota habis => failover, auth gagal => perbaiki .env,
// timeout => tunggu / cek jaringan.
const DB_ERROR_LABELS = {
  P1000: "Autentikasi database gagal",
  P1001: "Database tidak dapat dijangkau",
  P1002: "Koneksi database timeout",
  P1008: "Operasi database timeout",
  P1017: "Koneksi database ditutup server",
};

function describeDbError(err) {
  // Dua properti, bukan satu: PrismaClientKnownRequestError memakai `code`,
  // sedangkan PrismaClientInitializationError -- yang justru muncul saat DB
  // tidak terjangkau -- memakai `errorCode`. Membaca `code` saja membuat
  // kegagalan koneksi tampil tanpa kode sama sekali.
  const code = err?.code || err?.errorCode || null;
  if (code && DB_ERROR_LABELS[code]) return { code, reason: DB_ERROR_LABELS[code] };

  // Sebagian error datang tanpa kode apa pun, jadi teksnya yang harus dibaca.
  // Pesan aslinya TIDAK diteruskan keluar -- di dalamnya ada host, port, dan
  // nama user database. Yang keluar cuma label yang kita tulis sendiri.
  const raw = String(err?.message || "");

  // Kuota provider (Neon/Supabase free tier) datang sebagai error Postgres
  // biasa, bukan kode P Prisma. Ini yang mematikan produksi kemarin; tanpa
  // penanganan khusus ia tampil sama seperti error lain padahal tindakannya
  // beda (failover, bukan perbaiki kredensial).
  if (/quota|data transfer|exceeded/i.test(raw)) {
    return { code: code || "QUOTA", reason: "Kuota provider database terlampaui" };
  }
  if (/can't reach database server|connection refused|ENOTFOUND|ECONNREFUSED/i.test(raw)) {
    return { code: code || "UNREACHABLE", reason: "Database tidak dapat dijangkau" };
  }
  if (/authentication failed|password/i.test(raw)) {
    return { code: code || "AUTH", reason: "Autentikasi database gagal" };
  }
  if (/timeout|timed out/i.test(raw)) {
    return { code: code || "TIMEOUT", reason: "Koneksi database timeout" };
  }
  return { code, reason: "Kesalahan database tidak dikenal" };
}

async function getDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const [activityRows, maxConnRows, sizeRows] = await Promise.all([
      prisma.$queryRaw`SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database()`,
      prisma.$queryRaw`SELECT setting::int AS max_connections FROM pg_settings WHERE name = 'max_connections'`,
      prisma.$queryRaw`SELECT pg_database_size(current_database()) AS size`,
    ]);

    return {
      status: "healthy",
      active_connections: activityRows[0]?.count ?? null,
      max_connections: maxConnRows[0]?.max_connections ?? null,
      queries_per_second: null,
      slow_queries: null,
      database_size_bytes: sizeRows[0]?.size ? Number(sizeRows[0].size) : null,
      error_code: null,
      error_reason: null,
    };
  } catch (err) {
    const { code, reason } = describeDbError(err);
    // Dicetak penuh ke log server (aman, tidak keluar dari mesin) supaya
    // operator punya pesan aslinya; yang dikembalikan ke API cuma ringkasannya.
    console.error("[health] database unhealthy:", err?.message || err);
    return {
      status: "unhealthy",
      active_connections: null,
      max_connections: null,
      queries_per_second: null,
      slow_queries: null,
      database_size_bytes: null,
      error_code: code,
      error_reason: reason,
    };
  }
}

/**
 * Probe DB untuk monitor uptime eksternal. SENGAJA terpisah dari GET /health:
 * yang itu dijanjikan tanpa DB call dan di-ping tiap 45 detik oleh tiap klien
 * mobile. Yang ini satu query, dan balasannya 503 saat DB mati supaya monitor
 * bisa membedakannya dari backend yang benar-benar tumbang.
 */
export async function getDatabaseProbe() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latency_ms: Date.now() - startedAt };
  } catch (err) {
    const { code, reason } = describeDbError(err);
    console.error("[health/db] probe gagal:", err?.message || err);
    return { ok: false, latency_ms: Date.now() - startedAt, error_code: code, error_reason: reason };
  }
}

function getResources() {
  const cpuCount = os.cpus().length || 1;
  const loadAverage = os.loadavg();
  const cpuPercent = Math.min(100, Math.round((loadAverage[0] / cpuCount) * 100));
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryPercent = totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 100) : null;

  return {
    cpu_percent: cpuPercent,
    memory_percent: memoryPercent,
    load_average: loadAverage,
    disk_percent: null,
    network: null,
  };
}

export async function getSystemHealth() {
  const database = await getDatabaseHealth();
  const resources = getResources();
  const apiHealth = getSnapshot();

  const services = [
    { key: "application", label: "Application", status: "healthy" },
    { key: "database", label: "Database", status: database.status },
    ...NOT_INTEGRATED_SERVICES.map((s) => ({ ...s, status: "not_integrated" })),
  ];

  const status = database.status === "healthy" ? "OPERATIONAL" : "DEGRADED";

  return {
    status,
    services,
    resources,
    database,
    api_health: apiHealth,
    external_services: EXTERNAL_SERVICES.map((s) => ({ ...s, status: "not_integrated" })),
    system_events: null,
  };
}
