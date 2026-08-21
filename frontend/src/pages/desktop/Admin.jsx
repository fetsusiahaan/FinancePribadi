import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Table } from "../../components/ui/Table";
import { Pagination } from "../../components/ui/Pagination";
import { ScoreGauge } from "../../components/charts/ScoreGauge";
import { DonutChart } from "../../components/charts/DonutChart";
import { formatIDR, formatDate } from "../../utils/format";
import * as adminService from "../../services/admin.service";

const QUERY_KEY = ["admin-users"];

function scoreLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-semibold uppercase tracking-wide ${
        role === "ADMIN"
          ? "bg-primary/10 text-primary"
          : "bg-surface-container dark:bg-dark-surface-container text-on-surface-variant dark:text-dark-on-surface-variant"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ suspended }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-semibold uppercase tracking-wide ${
        suspended ? "bg-danger/10 text-danger dark:text-dark-danger" : "bg-success/10 text-success dark:text-dark-success"
      }`}
    >
      {suspended ? "Suspended" : "Aktif"}
    </span>
  );
}

function UserListView({ onSelect }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [...QUERY_KEY, { search, page }],
    queryFn: () => adminService.listUsers({ search, page, page_size: 20 }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminService.updateRole(id, role),
    onSuccess: invalidate,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, isSuspended }) => adminService.updateSuspend(id, isSuspended),
    onSuccess: invalidate,
  });

  const resetMutation = useMutation({
    mutationFn: (id) => adminService.resetPassword(id),
    onSuccess: (result) => setTempPassword(result.temp_password),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteUser(id),
    onSuccess: () => {
      setConfirmDelete(null);
      invalidate();
    },
  });

  const mutationError =
    roleMutation.error?.response?.data?.message ||
    suspendMutation.error?.response?.data?.message ||
    resetMutation.error?.response?.data?.message ||
    deleteMutation.error?.response?.data?.message;

  return (
    <div className="space-y-md">
      <div className="flex flex-col sm:flex-row sm:items-center gap-sm">
        <Input
          type="search"
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="sm:max-w-xs"
        />
        {isFetching && !isLoading && (
          <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
            Memuat...
          </span>
        )}
      </div>

      {mutationError && (
        <div role="alert" className="text-body-sm text-danger dark:text-dark-danger">
          {mutationError}
        </div>
      )}

      {isLoading ? (
        <Card>
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Memuat pengguna...</p>
        </Card>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState icon="group_off" title="Tidak ada pengguna" description="Coba kata kunci pencarian lain." />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table
            columns={[
              { key: "name", label: "Nama" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
              { key: "status", label: "Status" },
              { key: "score", label: "Skor" },
              { key: "joined", label: "Bergabung" },
              { key: "actions", label: "Aksi", align: "right" },
            ]}
          >
            {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container/60 dark:hover:bg-dark-surface-container/60">
                    <td className="px-md py-sm">
                      <button
                        type="button"
                        onClick={() => onSelect(u.id)}
                        className="font-medium text-on-background dark:text-dark-on-background hover:text-primary cursor-pointer text-left"
                      >
                        {u.name}
                      </button>
                    </td>
                    <td className="px-md py-sm text-on-surface-variant dark:text-dark-on-surface-variant">{u.email}</td>
                    <td className="px-md py-sm">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-md py-sm">
                      <StatusBadge suspended={u.is_suspended} />
                    </td>
                    <td className="px-md py-sm tnum">{u.financial_score ?? "-"}</td>
                    <td className="px-md py-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                      {formatDate(u.created_at.slice(0, 10))}
                    </td>
                    <td className="px-md py-sm">
                      <div className="flex items-center justify-end gap-xs flex-wrap">
                        <Button
                          variant="outline"
                          className="min-h-8 px-2 py-1 text-[12px]"
                          disabled={roleMutation.isPending}
                          onClick={() =>
                            roleMutation.mutate({ id: u.id, role: u.role === "ADMIN" ? "USER" : "ADMIN" })
                          }
                        >
                          {u.role === "ADMIN" ? "Turunkan" : "Jadikan Admin"}
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-8 px-2 py-1 text-[12px]"
                          disabled={suspendMutation.isPending}
                          onClick={() =>
                            suspendMutation.mutate({ id: u.id, isSuspended: !u.is_suspended })
                          }
                        >
                          {u.is_suspended ? "Aktifkan" : "Suspend"}
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-8 px-2 py-1 text-[12px]"
                          disabled={resetMutation.isPending}
                          onClick={() => resetMutation.mutate(u.id)}
                        >
                          Reset Password
                        </Button>
                        <Button
                          variant="danger"
                          className="min-h-8 px-2 py-1 text-[12px]"
                          onClick={() => setConfirmDelete(u)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </Table>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />
        </Card>
      )}

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Hapus pengguna?">
        <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          Tindakan ini permanen dan akan menghapus semua data transaksi, budget, dan lainnya milik{" "}
          <strong>{confirmDelete?.name}</strong>. Tidak bisa dibatalkan.
        </p>
        <div className="flex justify-end gap-sm mt-md">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(confirmDelete.id)}
          >
            {deleteMutation.isPending ? "Menghapus..." : "Hapus permanen"}
          </Button>
        </div>
      </Modal>

      <Modal open={!!tempPassword} onClose={() => setTempPassword(null)} title="Password sementara">
        <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          Sampaikan password ini ke pengguna lewat kanal aman. Password ini tidak akan ditampilkan lagi.
        </p>
        <p className="mt-sm font-mono text-body-sm bg-surface-container dark:bg-dark-surface-container rounded-lg px-md py-sm select-all">
          {tempPassword}
        </p>
      </Modal>
    </div>
  );
}

function UserDetailView({ userId, onBack }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => adminService.getUserDetail(userId),
  });

  if (isLoading) {
    return (
      <Card>
        <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Memuat detail...</p>
      </Card>
    );
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const { user, financial_summary: summary } = data;
  const donutData = (summary.current_month?.items || [])
    .filter((b) => b.spent > 0 && b.category)
    .map((b) => ({ category_id: b.category.id, name: b.category.name, amount: b.spent }));

  return (
    <div className="space-y-md">
      <Button variant="outline" onClick={onBack}>
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          arrow_back
        </span>
        Kembali ke daftar
      </Button>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-md justify-between">
          <div>
            <h2 className="font-semibold text-lg">{user.name}</h2>
            <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">{user.email}</p>
            <div className="flex items-center gap-xs mt-xs">
              <RoleBadge role={user.role} />
              <StatusBadge suspended={user.is_suspended} />
            </div>
          </div>
          {user.financial_score != null && (
            <ScoreGauge score={user.financial_score} label={scoreLabel(user.financial_score)} size={96} />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <Card>
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Total Pemasukan</p>
          <p className="tnum text-xl font-semibold mt-xs">{formatIDR(summary.all_time_income)}</p>
        </Card>
        <Card>
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Total Pengeluaran</p>
          <p className="tnum text-xl font-semibold mt-xs">{formatIDR(summary.all_time_expense)}</p>
        </Card>
        <Card>
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Jumlah Transaksi</p>
          <p className="tnum text-xl font-semibold mt-xs">{summary.transaction_count}</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold mb-sm">Pengeluaran Bulan Ini per Kategori</h3>
        {donutData.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
            Belum ada pengeluaran berbudget bulan ini.
          </p>
        ) : (
          <DonutChart data={donutData} />
        )}
      </Card>
    </div>
  );
}

export function Admin() {
  const [selectedUserId, setSelectedUserId] = useState(null);

  return selectedUserId ? (
    <UserDetailView userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
  ) : (
    <UserListView onSelect={setSelectedUserId} />
  );
}
