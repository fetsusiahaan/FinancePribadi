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

// Saldo jadi hero — kartu gradien besar yang menarik perhatian pertama kali,
// bukan sejajar dengan Pemasukan/Pengeluaran (§visual-hierarchy: ukuran & kontras,
// bukan warna saja, yang membedakan info paling penting).
function BalanceHero({ value }) {
  return (
    <Card className="p-lg relative overflow-hidden border-none bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/25">
      <span
        className="material-symbols-outlined absolute -right-3 -bottom-4 text-[128px] leading-none text-white/10"
        aria-hidden="true"
      >
        account_balance_wallet
      </span>
      <p className="relative text-body-sm text-white/85">Saldo Bulan Ini</p>
      <p className="relative tnum text-3xl font-bold mt-xs">{formatIDR(value)}</p>
    </Card>
  );
}

// Kartu pastel penuh (gaya FundFlex) untuk Pemasukan/Pengeluaran — latar warna
// solid tone-appropriate (bukan /10 opacity tipis), lebih besar dari chip lama.
function ActionCard({ label, value, icon, tone }) {
  const tones = {
    income: "bg-primary-container/25 dark:bg-primary/15 text-primary dark:text-primary-container",
    expense: "bg-danger-container/70 dark:bg-dark-danger/15 text-danger dark:text-dark-danger",
  };
  return (
    <div className={`rounded-2xl p-md ${tones[tone]}`}>
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {icon}
      </span>
      <p className="text-label-sm mt-sm">{label}</p>
      <p className="tnum text-body-sm font-semibold truncate">{formatIDR(value)}</p>
    </div>
  );
}

// Kartu promo non-interaktif untuk fitur yang belum punya backend — pola sama
// dengan ComingSoonRow di Profile, versi kartu penuh bukan baris daftar.
function GoalsPromoCard() {
  return (
    <div
      aria-disabled="true"
      className="rounded-2xl p-md flex items-center gap-sm bg-primary/5 dark:bg-primary/10 border border-primary/15 dark:border-primary/20"
    >
      <span
        className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <span className="material-symbols-outlined text-[20px]">flag</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-body-sm">Set Target Kamu</p>
        <p className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          Kendalikan pengeluaran dan capai targetmu.
        </p>
      </div>
      <span className="text-[11px] px-xs py-[1px] rounded bg-surface-container-lowest dark:bg-dark-surface-container-lowest text-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap shrink-0">
        Segera hadir
      </span>
    </div>
  );
}

// Placeholder berbentuk kartu supaya tinggi konten tidak melompat saat data tiba.
// Bentuknya mengikuti hierarchy baru: hero besar dulu, lalu 2 chip sejajar.
function DashboardSkeleton() {
  return (
    <div className="space-y-md motion-safe:animate-pulse" aria-hidden="true">
      <div className="h-[104px] rounded-xl bg-surface-container dark:bg-dark-surface-container" />
      <div className="grid grid-cols-2 gap-sm">
        <div className="h-[84px] rounded-xl bg-surface-container dark:bg-dark-surface-container" />
        <div className="h-[84px] rounded-xl bg-surface-container dark:bg-dark-surface-container" />
      </div>
      <div className="h-16 rounded-2xl bg-surface-container dark:bg-dark-surface-container" />
      <div className="h-20 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
      <div className="h-48 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
      <div className="h-56 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
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
    <DashboardLayout title="Dashboard">
      {/* MonthPicker dipindah ke body (bukan header actions) — di layar sempit,
          header title + actions + ThemeToggle + logout gampang berdesakan/tertutup. */}
      <div className="flex justify-center mb-md">
        <MonthPicker value={month} onChange={setMonth} />
      </div>

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
        // space-y-lg (24px, bukan md/16px) — jarak antar panel dilonggarkan
        // supaya tiap kartu bernapas, tidak saling menempel di layar sempit.
        <div className="space-y-lg">
          {/* Saldo sebagai hero, Pemasukan/Pengeluaran sebagai kartu pastel
              berdampingan — hierarki lewat ukuran, bukan pengulangan kartu identik. */}
          <BalanceHero value={data.total_balance} />
          <div className="grid grid-cols-2 gap-md">
            <ActionCard label="Pemasukan" value={data.monthly_income} icon="trending_up" tone="income" />
            <ActionCard label="Pengeluaran" value={data.monthly_expense} icon="trending_down" tone="expense" />
          </div>

          <GoalsPromoCard />

          {/* AI Insight (PRD §11) — dekorasi dipindah ke pojok kanan-bawah supaya
              tidak bertumpuk dgn label "AI INSIGHT" di kiri-atas. */}
          <Card className="p-md relative overflow-hidden border-primary/20 bg-primary/5 dark:bg-primary/10">
            <span
              className="material-symbols-outlined absolute -right-2 -bottom-3 text-[56px] leading-none text-primary/10"
              aria-hidden="true"
            >
              auto_awesome
            </span>
            <div className="relative flex gap-sm">
              <span
                className="material-symbols-outlined text-primary shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[18px]"
                aria-hidden="true"
              >
                auto_awesome
              </span>
              <div className="min-w-0">
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
                    className={`rounded-2xl border text-body-sm leading-relaxed overflow-hidden ${style.className}`}
                  >
                    <div className="flex items-start gap-sm px-md pt-md pb-sm">
                      <span className="material-symbols-outlined text-[20px] shrink-0 mt-[1px]" aria-hidden="true">
                        {style.icon}
                      </span>
                      <div>
                        <p>
                          Budget <strong>{alert.category?.name}</strong> terpakai{" "}
                          <span className="tnum">{alert.percentage}%</span>
                        </p>
                        <p>
                          <span className="tnum">{formatIDR(alert.spent)}</span> dari{" "}
                          <span className="tnum">{formatIDR(alert.amount_limit)}</span>
                        </p>
                      </div>
                    </div>
                    {/* Tombol full-width di baris terpisah — bukan disisipkan sebaris
                        dgn teks (terlihat menyatu/terjepit) atau diindentasi mengikuti
                        ikon di atasnya (tidak jelas itu aksi terpisah). */}
                    <Link
                      to="/budgets"
                      aria-label={`Atur budget ${alert.category?.name}`}
                      className="flex items-center justify-center gap-xs min-h-11 px-md font-semibold bg-surface-container-lowest/60 dark:bg-dark-surface-container-lowest/30 border-t border-current/20 hover:bg-surface-container-lowest dark:hover:bg-dark-surface-container-lowest/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-colors"
                    >
                      Atur Budget Ini
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Financial Health Score */}
          <Card className="p-md">
            <div className="flex items-center gap-sm mb-md">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  monitor_heart
                </span>
              </span>
              <h2 className="text-lg font-semibold">Financial Health Score</h2>
            </div>
            <div className="flex items-center gap-md">
              <ScoreGauge score={data.financial_score} label={data.financial_score_label} size={96} />
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

          {/* Cash Flow — overflow-x-auto sebagai jaring pengaman di layar sangat sempit. */}
          <Card className="p-md overflow-x-auto">
            <div className="flex items-center gap-sm mb-md">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  bar_chart
                </span>
              </span>
              <h2 className="text-lg font-semibold">Cash Flow 6 Bulan</h2>
            </div>
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

          {/* Expense by category */}
          <Card className="p-md">
            <div className="flex items-center gap-sm mb-md">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  donut_large
                </span>
              </span>
              <h2 className="text-lg font-semibold">Pengeluaran per Kategori</h2>
            </div>
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
              <div className="flex items-center gap-sm min-w-0">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    receipt_long
                  </span>
                </span>
                <h2 className="text-lg font-semibold truncate">Transaksi Terakhir</h2>
              </div>
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
                    <span className="w-9 h-9 rounded-2xl bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
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
      )}
    </DashboardLayout>
  );
}
