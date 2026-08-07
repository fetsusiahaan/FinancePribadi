import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Card } from "../components/ui/Card";
import { getSummary } from "../services/dashboard.service";

const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

export function Dashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getSummary });

  return (
    <DashboardLayout>
      {isLoading && <p>Memuat data...</p>}
      {isError && <p className="text-red-600 dark:text-red-400">Gagal memuat data dashboard.</p>}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-500 dark:text-dark-on-surface-variant">Total Balance</p>
            <p className="text-2xl font-semibold">{formatIDR(data.total_balance)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-dark-on-surface-variant">Monthly Income</p>
            <p className="text-2xl font-semibold text-secondary">{formatIDR(data.monthly_income)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-dark-on-surface-variant">Monthly Expense</p>
            <p className="text-2xl font-semibold text-red-500 dark:text-red-400">{formatIDR(data.monthly_expense)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-dark-on-surface-variant">Financial Score</p>
            <p className="text-2xl font-semibold text-accent">{data.financial_score}</p>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
