import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Table } from "../../../components/ui/Table";
import { Pagination } from "../../../components/ui/Pagination";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { listActivity } from "../../../services/admin.service";

const MODULES = ["Authentication", "Finance", "AI", "Profile", "Subscription", "Settings", "Security"];

const ACTIONS = [
  { value: "transaction.created", label: "Create Transaction" },
  { value: "transaction.updated", label: "Update Transaction" },
  { value: "transaction.deleted", label: "Delete Transaction" },
  { value: "budget.created", label: "Create Budget" },
  { value: "budget.updated", label: "Update Budget" },
  { value: "budget.deleted", label: "Delete Budget" },
  { value: "profile.updated", label: "Update Profile" },
  { value: "auth.login", label: "Login" },
];

function formatTime(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminUserActivity() {
  const [filters, setFilters] = useState({ user: "", action: "", module: "", ip: "", date: "" });
  const [page, setPage] = useState(1);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-activity", { ...filters, page }],
    queryFn: () => listActivity({ ...filters, page, page_size: 20 }),
  });

  return (
    <div className="space-y-md">
      <Card className="p-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-sm">
          <Input
            type="search"
            placeholder="Cari nama atau email..."
            value={filters.user}
            onChange={(e) => updateFilter("user", e.target.value)}
          />
          <Select value={filters.module} onChange={(e) => updateFilter("module", e.target.value)}>
            <option value="">Semua Module</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select value={filters.action} onChange={(e) => updateFilter("action", e.target.value)}>
            <option value="">Semua Activity</option>
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
          <Input type="date" value={filters.date} onChange={(e) => updateFilter("date", e.target.value)} />
          <Input
            type="text"
            placeholder="IP address..."
            value={filters.ip}
            onChange={(e) => updateFilter("ip", e.target.value)}
          />
        </div>
        {isFetching && !isLoading && (
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant mt-sm">Memuat...</p>
        )}
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Memuat aktivitas...</p>
        </Card>
      ) : isError ? (
        <ErrorState onRetry={refetch} retrying={isFetching} />
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon="history"
            title="Tidak ada aktivitas"
            description="Belum ada aktivitas yang tercatat untuk filter ini."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table
            columns={[
              { key: "user", label: "User" },
              { key: "activity", label: "Activity" },
              { key: "module", label: "Module" },
              { key: "ip", label: "IP" },
              { key: "time", label: "Time" },
            ]}
          >
            {data.items.map((item) => (
              <tr key={item.id} className="hover:bg-surface-container/60 dark:hover:bg-dark-surface-container/60">
                <td className="px-md py-sm">
                  <p className="font-medium text-on-background dark:text-dark-on-background">{item.user.name}</p>
                  <p className="text-[11px] text-on-surface-variant dark:text-dark-on-surface-variant">
                    {item.user.email}
                  </p>
                </td>
                <td className="px-md py-sm">{item.action_label}</td>
                <td className="px-md py-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                  {item.module}
                </td>
                <td className="px-md py-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                  {item.ip_address || "—"}
                </td>
                <td className="px-md py-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                  {formatTime(item.created_at)}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
