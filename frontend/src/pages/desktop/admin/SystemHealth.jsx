import { useQuery } from "@tanstack/react-query";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { getSystemHealth } from "../../../services/admin.service";

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return null;
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function formatMs(ms) {
  if (ms === null || ms === undefined) return "—";
  return `${ms} ms`;
}

function StatusDot({ status }) {
  const color =
    status === "healthy"
      ? "bg-success dark:bg-dark-success"
      : status === "unhealthy"
        ? "bg-danger dark:bg-dark-danger"
        : "bg-outline dark:bg-dark-outline";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />;
}

function statusLabel(status) {
  if (status === "healthy") return "Healthy";
  if (status === "unhealthy") return "Unhealthy";
  return "Belum terintegrasi";
}

function ServiceRow({ label, status }) {
  const textColor =
    status === "healthy"
      ? "text-success dark:text-dark-success"
      : status === "unhealthy"
        ? "text-danger dark:text-dark-danger"
        : "text-on-surface-variant dark:text-dark-on-surface-variant";
  return (
    <div className="flex items-center justify-between gap-sm py-xs">
      <span className="text-body-sm">{label}</span>
      <span className={`flex items-center gap-xs text-body-sm font-medium ${textColor}`}>
        <StatusDot status={status} />
        {statusLabel(status)}
      </span>
    </div>
  );
}

function ResourceBar({ label, percent }) {
  const barColor =
    percent >= 90
      ? "bg-danger dark:bg-dark-danger"
      : percent >= 70
        ? "bg-warning dark:bg-dark-warning"
        : "bg-success dark:bg-dark-success";
  return (
    <div className="py-xs">
      <div className="flex items-center justify-between gap-sm mb-xs">
        <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">{label}</span>
        <span className="tnum text-body-sm font-semibold">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 rounded-full bg-surface-variant dark:bg-dark-surface-variant overflow-hidden"
      >
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-sm py-xs">
      <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">{label}</span>
      <span className="tnum text-body-sm font-semibold">{value ?? "Belum tersedia"}</span>
    </div>
  );
}

function SystemHealthSkeleton() {
  return (
    <div className="space-y-md motion-safe:animate-pulse" aria-hidden="true">
      <div className="h-16 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
        ))}
      </div>
    </div>
  );
}

export function AdminSystemHealth() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: getSystemHealth,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <>
        <p className="sr-only" role="status">
          Memuat status sistem
        </p>
        <SystemHealthSkeleton />
      </>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} retrying={isFetching} />;
  }

  const operational = data.status === "OPERATIONAL";
  const since = data.api_health.since ? new Date(data.api_health.since).toLocaleString("id-ID") : "—";

  return (
    <div className="space-y-md">
      {/* Status besar */}
      <Card className="p-md flex items-center gap-sm">
        <span
          className={`inline-block h-3 w-3 rounded-full ${
            operational ? "bg-success dark:bg-dark-success" : "bg-danger dark:bg-dark-danger"
          }`}
          aria-hidden="true"
        />
        <p className={`text-lg font-semibold ${operational ? "text-success dark:text-dark-success" : "text-danger dark:text-dark-danger"}`} role="status">
          SYSTEM {data.status}
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Service grid */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">Services</h2>
          <div className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
            {data.services.map((s) => (
              <ServiceRow key={s.key} label={s.label} status={s.status} />
            ))}
          </div>
        </Card>

        {/* Server Resources */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">Server Resources</h2>
          <div className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
            <ResourceBar label="CPU Usage" percent={data.resources.cpu_percent ?? 0} />
            <ResourceBar label="Memory" percent={data.resources.memory_percent ?? 0} />
            <SummaryRow
              label="Load Average (1m / 5m / 15m)"
              value={data.resources.load_average.map((n) => n.toFixed(2)).join(" / ")}
            />
            <SummaryRow label="Disk" value={data.resources.disk_percent} />
            <SummaryRow label="Network" value={data.resources.network} />
          </div>
        </Card>

        {/* Database */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">Database</h2>
          <div className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
            <SummaryRow label="Status" value={statusLabel(data.database.status)} />
            <SummaryRow label="Active Connections" value={data.database.active_connections} />
            <SummaryRow label="Max Connections" value={data.database.max_connections} />
            <SummaryRow label="Query / Second" value={data.database.queries_per_second} />
            <SummaryRow label="Slow Queries" value={data.database.slow_queries} />
            <SummaryRow label="Database Size" value={formatBytes(data.database.database_size_bytes)} />
          </div>
        </Card>

        {/* API Health */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">API Health</h2>
          <p className="text-[11px] text-on-surface-variant dark:text-dark-on-surface-variant mb-sm">
            Sejak server start: {since} · {data.api_health.total_requests} request tercatat
          </p>
          <div className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
            <SummaryRow label="Success Rate" value={`${data.api_health.success_rate_percent}%`} />
            <SummaryRow label="Avg Response" value={formatMs(data.api_health.avg_response_ms)} />
            <SummaryRow label="P95 Response" value={formatMs(data.api_health.p95_response_ms)} />
            <SummaryRow label="Error Rate" value={`${data.api_health.error_rate_percent}%`} />
            <SummaryRow label="4xx" value={data.api_health.count_4xx} />
            <SummaryRow label="5xx" value={data.api_health.count_5xx} />
            <SummaryRow label="Timeout" value={data.api_health.count_timeout} />
          </div>
        </Card>

        {/* External Services */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">External Services</h2>
          <div className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
            {data.external_services.map((s) => (
              <ServiceRow key={s.key} label={s.label} status={s.status} />
            ))}
          </div>
        </Card>

        {/* System Events */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">System Events</h2>
          <EmptyState icon="event_note" title="Belum tersedia" description="Belum ada event log yang tercatat." />
        </Card>
      </div>
    </div>
  );
}
