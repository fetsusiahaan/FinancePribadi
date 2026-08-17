import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { MonthPicker } from "../../components/ui/MonthPicker";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { DonutChart } from "../../components/charts/DonutChart";
import { CashflowChart } from "../../components/charts/CashflowChart";
import { ScoreGauge } from "../../components/charts/ScoreGauge";
import { getSummary, getCashflow } from "../../services/dashboard.service";
import { formatIDR, formatDate, currentMonthValue } from "../../utils/format";

const STATUS_STYLE = {
  WARNING: {
    icon: "warning",
    className: "bg-warning/10 text-warning dark:text-dark-warning border-warning/30",
  },
  EXCEEDED: {
    icon: "error",
    className: "bg-danger/10 text-danger dark:text-dark-danger border-danger/30",
  },
};

const SCORE_LABELS = {
  savings_rate: "Savings Rate",
  expense_control: "Expense Control",
  budget_discipline: "Budget Discipline",
  income_stability: "Income Stability",
};

function StatCard({ label, value, icon, tone = "default" }) {
  const tones = {
    default: "text-on-background dark:text-dark-on-background",
    income: "text-success dark:text-dark-success",
    expense: "text-danger dark:text-dark-danger",
  };
  return (
    <Card className="p-md">
      <div className="flex items-center gap-sm mb-xs text-on-surface-variant dark:text-dark-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          {icon}
        </span>
        <p className="text-body-sm">{label}</p>
      </div>
      <p className={`tnum text-xl font-semibold ${tones[tone]}`}>{formatIDR(value)}</p>
    </Card>
  );
}

// Placeholder berbentuk kartu supaya tinggi konten tidak melompat saat data tiba.
function DashboardSkeleton() {
  return (
    <div className="space-y-md motion-safe:animate-pulse" aria-hidden="true">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[92px] rounded-xl bg-surface-container dark:bg-dark-surface-container" />
        ))}
      </div>
      <div className="h-20 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <div className="h-56 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
        <div className="h-56 lg:col-span-2 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const [month, setMonth] = useState(currentMonthValue);

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", month],
    queryFn: () => getSummary(month),
  });
  const cashflowQuery = useQuery({ queryKey: ["dashboard-cashflow"], queryFn: () => getCashflow(6) });

  const data = summaryQuery.data;

  return (
    <DashboardLayout title="Dashboard" actions={<MonthPicker value={month} onChange={setMonth} />}>
      {summaryQuery.isLoading && (
        <>
          <p className="sr-only" role="status">
            Memuat data dashboard
          </p>
          <DashboardSkeleton />
        </>
      )}
      {summaryQuery.isError && (
        <ErrorState onRetry={summaryQuery.refetch} retrying={summaryQuery.isRefetching} />
      )}

      {data && (
        <div className="space-y-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            <StatCard label="Saldo Bulan Ini" value={data.total_balance} icon="account_balance_wallet" />
            <StatCard label="Pemasukan" value={data.monthly_income} icon="trending_up" tone="income" />
            <StatCard label="Pengeluaran" value={data.monthly_expense} icon="trending_down" tone="expense" />
          </div>

          {/* AI Insight (PRD §11) */}
          <Card className="p-md border border-primary/20 bg-primary/5 dark:bg-primary/10">
            <div className="flex gap-sm">
              <span className="material-symbols-outlined text-primary shrink-0" aria-hidden="true">
                auto_awesome
              </span>
              <div>
                <p className="text-label-sm uppercase tracking-wider text-primary mb-xs">AI Insight</p>
                <p className="text-body-sm text-on-background dark:text-dark-on-background">{data.ai_insight}</p>
              </div>
            </div>
          </Card>

          {data.budget_alerts.length > 0 && (
            <div className="space-y-xs">
              {data.budget_alerts.map((alert) => {
                const style = STATUS_STYLE[alert.status];
                return (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-sm px-md py-sm rounded-lg border text-body-sm ${style.className}`}
                  >
                    <span className="material-symbols-outlined text-[20px] shrink-0" aria-hidden="true">
                      {style.icon}
                    </span>
                    <span className="flex-1">
                      Budget <strong>{alert.category?.name}</strong> terpakai{" "}
                      <span className="tnum">{alert.percentage}%</span> (
                      <span className="tnum">{formatIDR(alert.spent)}</span> dari{" "}
                      <span className="tnum">{formatIDR(alert.amount_limit)}</span>)
                    </span>
                    <Link
                      to="/budgets"
                      aria-label={`Atur budget ${alert.category?.name}`}
                      className="inline-flex items-center min-h-11 px-sm rounded-md font-medium whitespace-nowrap hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Atur
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
            {/* Financial Health Score */}
            <Card className="p-md">
              <h2 className="text-lg font-semibold mb-md">Financial Health Score</h2>
              <div className="flex items-center gap-md">
                <ScoreGauge score={data.financial_score} label={data.financial_score_label} />
                <ul className="flex-1 space-y-xs text-body-sm">
                  {Object.entries(data.financial_score_breakdown).map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-sm">
                      <span className="text-on-surface-variant dark:text-dark-on-surface-variant">
                        {SCORE_LABELS[key] || key}
                      </span>
                      <span className="tnum font-medium">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Cash Flow */}
            <Card className="p-md lg:col-span-2">
              <h2 className="text-lg font-semibold mb-md">Cash Flow 6 Bulan</h2>
              {cashflowQuery.isLoading && (
                <div
                  className="h-40 rounded-lg bg-surface-container dark:bg-dark-surface-container motion-safe:animate-pulse"
                  aria-hidden="true"
                />
              )}
              {cashflowQuery.isError && (
                <ErrorState onRetry={cashflowQuery.refetch} retrying={cashflowQuery.isRefetching} />
              )}
              {cashflowQuery.data && <CashflowChart data={cashflowQuery.data} />}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
            {/* Expense by category */}
            <Card className="p-md">
              <h2 className="text-lg font-semibold mb-md">Pengeluaran per Kategori</h2>
              {data.expense_by_category.length > 0 ? (
                <DonutChart data={data.expense_by_category} />
              ) : (
                <EmptyState
                  icon="donut_large"
                  title="Belum ada pengeluaran"
                  description="Catat pengeluaran bulan ini untuk melihat sebarannya."
                />
              )}
            </Card>

            {/* Recent transactions */}
            <Card className="p-md">
              <div className="flex items-center justify-between gap-sm mb-md">
                <h2 className="text-lg font-semibold">Transaksi Terakhir</h2>
                <Link
                  to="/transactions"
                  className="inline-flex items-center min-h-11 px-sm -mr-2 rounded-md text-body-sm text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Lihat semua
                </Link>
              </div>
              {data.recent_transactions.length > 0 ? (
                <ul className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
                  {data.recent_transactions.map((tx) => (
                    <li key={tx.id} className="flex items-center gap-sm py-sm">
                      <span className="w-9 h-9 rounded-lg bg-surface-container dark:bg-dark-surface-container flex items-center justify-center shrink-0">
                        <span
                          className="material-symbols-outlined text-[20px] text-on-surface-variant dark:text-dark-on-surface-variant"
                          aria-hidden="true"
                        >
                          {tx.category?.icon || "payments"}
                        </span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium truncate">
                          {tx.description || tx.category?.name}
                        </p>
                        <p className="text-[12px] text-on-surface-variant dark:text-dark-on-surface-variant">
                          {tx.category?.name} · {formatDate(tx.date)}
                        </p>
                      </div>
                      <span
                        className={`tnum text-body-sm font-semibold whitespace-nowrap ${
                          tx.category?.type === "INCOME"
                            ? "text-success dark:text-dark-success"
                            : "text-danger dark:text-dark-danger"
                        }`}
                      >
                        {tx.category?.type === "INCOME" ? "+" : "-"}
                        {formatIDR(tx.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon="receipt_long"
                  title="Belum ada transaksi"
                  description="Mulai catat pemasukan dan pengeluaran kamu."
                  action={
                    <Link
                      to="/transactions"
                      className="inline-flex items-center justify-center gap-xs min-h-11 px-md bg-primary text-on-primary rounded-lg text-body-sm font-medium shadow-sm hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        add
                      </span>
                      Tambah Transaksi
                    </Link>
                  }
                />
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
