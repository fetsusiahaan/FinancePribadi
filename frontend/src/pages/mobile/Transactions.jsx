import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { MonthPicker } from "../../components/ui/MonthPicker";
import { TransactionForm } from "../../components/TransactionForm";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../services/transaction.service";
import { formatDate, currentMonthValue } from "../../utils/format";
import { useCurrency } from "../../contexts/CurrencyContext";

export function Transactions() {
  const { formatMoney } = useCurrency();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonthValue);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | {mode:"create"} | {mode:"edit", transaction}
  const [formError, setFormError] = useState(null);

  const filters = { month, page, limit: 20, ...(type ? { type } : {}) };

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-cashflow"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      modal?.mode === "edit" ? updateTransaction(modal.transaction.id, payload) : createTransaction(payload),
    onSuccess: () => {
      invalidate();
      setModal(null);
      setFormError(null);
    },
    onError: (err) => setFormError(err.response?.data?.message || "Gagal menyimpan transaksi"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: invalidate,
  });

  function handleDelete(tx) {
    if (window.confirm(`Hapus transaksi "${tx.description || tx.category?.name}"?`)) {
      deleteMutation.mutate(tx.id);
    }
  }

  function openCreate() {
    setFormError(null);
    setModal({ mode: "create" });
  }

  // Tombol + di bottom nav menautkan ke /transactions?new=1 supaya membuka
  // modal Tambah Transaksi dari halaman manapun tanpa menduplikasi state modal.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openCreate();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const items = data?.data || [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout title="Transaksi">
      <div className="space-y-md">
        {/* Filter ditumpuk vertikal — MonthPicker terpusat (pola sama seperti
            Dashboard mobile), Select tipe full-width supaya tidak kepotong. */}
        <div className="space-y-sm">
          <div className="flex justify-center">
            <MonthPicker
              value={month}
              onChange={(value) => {
                setMonth(value);
                setPage(1);
              }}
            />
          </div>
          <label className="sr-only" htmlFor="type-filter">
            Filter tipe transaksi
          </label>
          <Select
            id="type-filter"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua tipe</option>
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
          </Select>
        </div>

        {/* Header sudah sesak (title + profil + tema + logout) — tombol Tambah
            dipindah full-width di body, bukan FAB (akan tumpang tindih bottom nav). */}
        <Button onClick={openCreate} className="w-full">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Tambah Transaksi
        </Button>

        {isLoading && (
          <p className="text-on-surface-variant dark:text-dark-on-surface-variant">Memuat data...</p>
        )}
        {isError && <ErrorState onRetry={refetch} retrying={isRefetching} />}

        {items.length > 0 && (
          <div className="space-y-sm">
            {items.map((tx) => (
              <Card key={tx.id} className="p-md">
                <div className="flex items-start gap-sm">
                  <span className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      {tx.category?.icon || "payments"}
                    </span>
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium truncate">
                      {tx.description || tx.category?.name}
                      {tx.is_recurring && (
                        <span className="ml-xs text-[11px] px-xs py-[1px] rounded bg-primary/10 text-primary align-middle">
                          rutin
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] text-on-surface-variant dark:text-dark-on-surface-variant">
                      {tx.category?.name} · {formatDate(tx.date)}
                    </p>
                  </div>

                  {/* Tanda +/- membawa arti tanpa bergantung pada warna. */}
                  <span
                    className={`tnum text-body-sm font-semibold whitespace-nowrap ${
                      tx.category?.type === "INCOME"
                        ? "text-success dark:text-dark-success"
                        : "text-danger dark:text-dark-danger"
                    }`}
                  >
                    {tx.category?.type === "INCOME" ? "+" : "-"}
                    {formatMoney(tx.amount)}
                  </span>
                </div>

                {/* Aksi di baris bawah kartu — tidak berdesakan dengan nominal
                    seperti versi baris tunggal di desktop. */}
                <div className="flex items-center justify-end gap-xs mt-sm pt-sm border-t border-outline-variant/40 dark:border-dark-outline-variant/40">
                  <button
                    type="button"
                    aria-label={`Ubah transaksi ${tx.description || tx.category?.name}`}
                    onClick={() => {
                      setFormError(null);
                      setModal({ mode: "edit", transaction: tx });
                    }}
                    className="w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      edit
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus transaksi ${tx.description || tx.category?.name}`}
                    onClick={() => handleDelete(tx)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-danger/10 hover:text-danger dark:hover:text-dark-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      delete
                    </span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <Card className="p-0">
            <EmptyState
              icon="receipt_long"
              title="Belum ada transaksi"
              description="Catat pemasukan atau pengeluaran pertamamu di bulan ini."
              action={<Button onClick={openCreate}>Tambah Transaksi</Button>}
            />
          </Card>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="flex flex-col gap-sm">
            <span className="text-body-sm text-center text-on-surface-variant dark:text-dark-on-surface-variant">
              Halaman {pagination.page} dari {pagination.total_pages} · {pagination.total} transaksi
            </span>
            <div className="flex gap-sm">
              <Button
                variant="outline"
                className="flex-1"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={page >= pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Ubah Transaksi" : "Tambah Transaksi"}
      >
        {modal && (
          <TransactionForm
            initial={modal.mode === "edit" ? modal.transaction : null}
            onSubmit={(payload) => saveMutation.mutate(payload)}
            onCancel={() => setModal(null)}
            submitting={saveMutation.isPending}
            error={formError}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
