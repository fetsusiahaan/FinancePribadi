import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { MonthPicker } from "../../components/ui/MonthPicker";
import { getBudgets, createBudget, updateBudget, deleteBudget } from "../../services/budget.service";
import { getCategories } from "../../services/category.service";
import { currentMonthValue, formatThousands, stripThousands } from "../../utils/format";
import { useCurrency } from "../../contexts/CurrencyContext";

// Setiap status membawa ikon, bukan hanya warna — supaya tetap terbaca
// oleh pengguna buta warna dan pembaca layar.
const STATUS_META = {
  SAFE: {
    label: "Aman",
    icon: "check_circle",
    bar: "bg-success dark:bg-dark-success",
    chip: "bg-success/10 text-success dark:text-dark-success",
  },
  WARNING: {
    label: "Hampir habis",
    icon: "warning",
    bar: "bg-warning dark:bg-dark-warning",
    chip: "bg-warning/10 text-warning dark:text-dark-warning",
  },
  EXCEEDED: {
    label: "Terlampaui",
    icon: "error",
    bar: "bg-danger dark:bg-dark-danger",
    chip: "bg-danger/10 text-danger dark:text-dark-danger",
  },
};

function BudgetForm({ initial, month, existingCategoryIds, onSubmit, onCancel, submitting, error }) {
  const isEdit = Boolean(initial);
  const [categoryId, setCategoryId] = useState(initial?.category?.id || "");
  const [amountLimit, setAmountLimit] = useState(initial ? String(initial.amount_limit) : "");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "EXPENSE"],
    queryFn: () => getCategories("EXPENSE"),
  });

  // Kategori yang sudah punya budget bulan ini disembunyikan supaya tidak bentrok 409.
  const available = useMemo(
    () => (isEdit ? categories : categories.filter((c) => !existingCategoryIds.includes(c.id))),
    [categories, existingCategoryIds, isEdit]
  );

  useEffect(() => {
    if (!isEdit && !categoryId && available.length > 0) setCategoryId(available[0].id);
  }, [available, categoryId, isEdit]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(
      isEdit
        ? { amount_limit: Number(amountLimit) }
        : { category_id: categoryId, amount_limit: Number(amountLimit), month_year: `${month}-01` }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-md">
      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="category">
          Kategori
        </label>
        {isEdit ? (
          <Input id="category" value={initial.category?.name || ""} disabled />
        ) : (
          <Select id="category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="" disabled>
              Pilih kategori
            </option>
            {available.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        )}
        {!isEdit && available.length === 0 && (
          <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
            Semua kategori pengeluaran sudah punya budget bulan ini.
          </p>
        )}
      </div>

      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="limit">
          Batas Anggaran (Rp)
        </label>
        <Input
          id="limit"
          type="text"
          inputMode="numeric"
          required
          placeholder="2.000.000"
          className="tnum"
          value={formatThousands(amountLimit)}
          onChange={(e) => setAmountLimit(stripThousands(e.target.value))}
        />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-xs text-body-sm text-danger dark:text-dark-danger">
          <span className="material-symbols-outlined text-[16px] leading-5 shrink-0" aria-hidden="true">
            error
          </span>
          {error}
        </p>
      )}

      <div className="flex gap-sm pt-xs">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting || (!isEdit && !categoryId)}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

export function Budgets() {
  const { formatMoney } = useCurrency();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonthValue);
  const [modal, setModal] = useState(null);
  const [formError, setFormError] = useState(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => getBudgets(month),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      modal?.mode === "edit" ? updateBudget(modal.budget.id, payload) : createBudget(payload),
    onSuccess: () => {
      invalidate();
      setModal(null);
      setFormError(null);
    },
    onError: (err) => setFormError(err.response?.data?.message || "Gagal menyimpan budget"),
  });

  const deleteMutation = useMutation({ mutationFn: deleteBudget, onSuccess: invalidate });

  function handleDelete(budget) {
    if (window.confirm(`Hapus budget ${budget.category?.name}?`)) deleteMutation.mutate(budget.id);
  }

  function openCreate() {
    setFormError(null);
    setModal({ mode: "create" });
  }

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <DashboardLayout title="Budget">
      <div className="space-y-md">
        {/* MonthPicker terpusat, sama seperti pola Dashboard/Transaksi mobile —
            bukan diletakkan di header actions yang gampang berdesakan. */}
        <div className="flex justify-center">
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        {/* Header sudah sesak (title + profil + tema + logout) — tombol Tambah
            dipindah full-width di body, konsisten dgn mobile/Transactions.jsx. */}
        <Button onClick={openCreate} className="w-full">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Tambah Budget
        </Button>

        {isLoading && <p className="text-on-surface-variant dark:text-dark-on-surface-variant">Memuat data...</p>}
        {isError && <ErrorState onRetry={refetch} retrying={isRefetching} />}

        {summary && items.length > 0 && (
          <Card className="p-md">
            <div className="flex items-center gap-sm mb-sm">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  savings
                </span>
              </span>
              <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Total terpakai</p>
            </div>
            <p className="tnum text-xl font-semibold">
              {formatMoney(summary.total_spent)}{" "}
              <span className="text-body-sm font-normal text-on-surface-variant dark:text-dark-on-surface-variant">
                dari {formatMoney(summary.total_limit)}
              </span>
            </p>
            <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant mt-xs">
              Sisa <strong className="tnum text-on-background dark:text-dark-on-background">{formatMoney(summary.total_remaining)}</strong>
            </p>
            <div
              role="progressbar"
              aria-valuenow={summary.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Total pemakaian budget bulan ini"
              className="h-2 rounded-full bg-surface-variant dark:bg-dark-surface-variant overflow-hidden mt-sm"
            >
              <div
                className={`h-full rounded-full ${summary.percentage >= 100 ? "bg-danger dark:bg-dark-danger" : summary.percentage >= 80 ? "bg-warning dark:bg-dark-warning" : "bg-success dark:bg-dark-success"}`}
                style={{ width: `${Math.min(100, summary.percentage)}%` }}
              />
            </div>
          </Card>
        )}

        {items.length > 0 && (
          <div className="space-y-sm">
            {items.map((budget) => {
              const meta = STATUS_META[budget.status];
              return (
                <Card key={budget.id} className="p-md">
                  <div className="flex items-start gap-sm mb-sm">
                    <span className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        {budget.category?.icon || "savings"}
                      </span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{budget.category?.name}</p>
                      <span
                        className={`inline-flex items-center gap-[3px] mt-[2px] text-[11px] px-xs py-[1px] rounded ${meta.chip}`}
                      >
                        <span className="material-symbols-outlined text-[13px] leading-none" aria-hidden="true">
                          {meta.icon}
                        </span>
                        {meta.label}
                      </span>
                    </div>
                    <span className="tnum font-medium shrink-0">{budget.percentage}%</span>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={budget.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Pemakaian budget ${budget.category?.name}: ${meta.label}`}
                    className="h-2 rounded-full bg-surface-variant dark:bg-dark-surface-variant overflow-hidden mb-xs"
                  >
                    <div
                      className={`h-full rounded-full ${meta.bar}`}
                      style={{ width: `${Math.min(100, budget.percentage)}%` }}
                    />
                  </div>

                  <p className="tnum text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                    {formatMoney(budget.spent)} / {formatMoney(budget.amount_limit)}
                  </p>

                  {/* Aksi di baris bawah kartu, konsisten dgn mobile/Transactions.jsx —
                      tidak berdesakan dengan persentase/kategori di atas. */}
                  <div className="flex items-center justify-end gap-xs mt-sm pt-sm border-t border-outline-variant/40 dark:border-dark-outline-variant/40">
                    <button
                      type="button"
                      aria-label={`Ubah budget ${budget.category?.name}`}
                      onClick={() => {
                        setFormError(null);
                        setModal({ mode: "edit", budget });
                      }}
                      className="w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus budget ${budget.category?.name}`}
                      onClick={() => handleDelete(budget)}
                      className="w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-danger/10 hover:text-danger dark:hover:text-dark-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                        delete
                      </span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <Card className="p-0">
            <EmptyState
              icon="savings"
              title="Belum ada budget bulan ini"
              description="Tetapkan batas anggaran per kategori. Finetra AI akan mengingatkan kalau hampir habis."
              action={<Button onClick={openCreate}>Buat Budget</Button>}
            />
          </Card>
        )}
      </div>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Ubah Budget" : "Buat Budget"}
      >
        {modal && (
          <BudgetForm
            initial={modal.mode === "edit" ? modal.budget : null}
            month={month}
            existingCategoryIds={items.map((b) => b.category?.id)}
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
