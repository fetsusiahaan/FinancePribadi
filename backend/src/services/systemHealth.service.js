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
    };
  } catch {
    return {
      status: "unhealthy",
      active_connections: null,
      max_connections: null,
      queries_per_second: null,
      slow_queries: null,
      database_size_bytes: null,
    };
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
