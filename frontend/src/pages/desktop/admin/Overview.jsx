import { useQuery } from "@tanstack/react-query";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { formatIDR, formatThousands } from "../../../utils/format";
import { getOverview } from "../../../services/admin.service";

const KPI_CARDS = [
  { key: "total_users", label: "Total Users", icon: "group", formatter: formatThousands },
  { key: "active_users", label: "Active Users", icon: "how_to_reg", formatter: formatThousands },
  { key: "new_users_today", label: "New Users Today", icon: "person_add", formatter: formatThousands },
  { key: "total_transactions", label: "Total Transactions", icon: "receipt_long", formatter: formatThousands },
  { key: "total_transaction_value", label: "Total Transaction Value", icon: "payments", formatter: formatIDR },
  { key: "ai_requests_today", label: "AI Requests Today", icon: "smart_toy", formatter: formatThousands },
  { key: "ai_cost_today", label: "AI Cost Today", icon: "toll", formatter: formatIDR },
  { key: "monthly_revenue", label: "Monthly Revenue", icon: "trending_up", formatter: formatIDR },
];

function KpiCard({ label, icon, value, formatter }) {
  const available = value !== null && value !== undefined;
  return (
    <Card className="p-md">
      <div className="flex items-center gap-sm mb-xs text-on-surface-variant dark:text-dark-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          {icon}
        </span>
        <p className="text-body-sm">{label}</p>
      </div>
      {available ? (
        <p className="tnum text-xl font-semibold">{formatter(value)}</p>
      ) : (
        <>
          <p className="text-xl font-semibold text-on-surface-variant dark:text-dark-on-surface-variant">—</p>
          <p className="text-[11px] text-on-surface-variant dark:text-dark-on-surface-variant mt-[2px]">
            Belum tersedia
          </p>
        </>
      )}
    </Card>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-sm py-xs">
      <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">{label}</span>
      <span className="tnum text-body-sm font-semibold">{value}</span>
    </div>
  );
}

function UnavailableRow({ label }) {
  return (
    <div className="flex items-center justify-between gap-sm py-xs">
      <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">{label}</span>
      <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
        Belum tersedia
      </span>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-md motion-safe:animate-pulse" aria-hidden="true">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[92px] rounded-xl bg-surface-container dark:bg-dark-surface-container" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
        ))}
      </div>
    </div>
  );
}

export function AdminOverview() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: getOverview,
  });

  if (isLoading) {
    return (
      <>
        <p className="sr-only" role="status">
          Memuat overview admin
        </p>
        <OverviewSkeleton />
      </>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} retrying={isFetching} />;
  }

  return (
    <div className="space-y-md">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {KPI_CARDS.map((card) => (
          <KpiCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            value={data.kpi[card.key]}
            formatter={card.formatter}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* User Summary */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">User Summary</h2>
          <div className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
            <SummaryRow label="Total users" value={formatThousands(data.user_summary.total_users)} />
            <SummaryRow label="Active users" value={formatThousands(data.user_summary.active_users)} />
            <SummaryRow label="New users" value={formatThousands(data.user_summary.new_users_today)} />
            <SummaryRow label="Suspended users" value={formatThousands(data.user_summary.suspended_users)} />
            <SummaryRow label="User growth %" value={`${data.user_summary.growth_percent}%`} />
          </div>
        </Card>

        {/* Finance Summary */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">Finance Summary</h2>
          <div className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
            <SummaryRow label="Total transaksi hari ini" value={formatThousands(data.finance_summary.transactions_today)} />
            <SummaryRow label="Total nilai transaksi" value={formatIDR(data.finance_summary.total_value)} />
            <SummaryRow label="Income" value={formatIDR(data.finance_summary.income)} />
            <SummaryRow label="Expense" value={formatIDR(data.finance_summary.expense)} />
            <UnavailableRow label="Jumlah akun" />
            <SummaryRow label="Jumlah financial goals" value={formatThousands(data.finance_summary.goals_count)} />
          </div>
        </Card>

        {/* AI Summary */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">AI Summary</h2>
          <EmptyState
            icon="smart_toy"
            title="Belum tersedia"
            description="Belum ada modul AI usage tracking (model, provider, token, cost) yang terhubung."
          />
        </Card>

        {/* Subscription */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">Subscription</h2>
          <EmptyState
            icon="credit_card"
            title="Belum tersedia"
            description="Belum ada modul subscription/billing yang terhubung."
          />
        </Card>

        {/* Recent Activity */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">Recent Activity</h2>
          <EmptyState icon="history" title="Belum tersedia" description="Belum ada activity log yang tercatat." />
        </Card>

        {/* System Alert */}
        <Card className="p-md">
          <h2 className="text-lg font-semibold mb-sm">System Alert</h2>
          <EmptyState
            icon="warning"
            title="Belum tersedia"
            description="Belum ada sistem monitoring/alert (API provider, AI quota, database, payment gateway, storage) yang terhubung."
          />
        </Card>
      </div>
    </div>
  );
}
