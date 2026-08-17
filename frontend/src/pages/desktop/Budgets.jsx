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
import { formatIDR, currentMonthValue, formatThousands, stripThousands } from "../../utils/format";

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

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <DashboardLayout
      title="Budget"
      actions={
        <>
          <MonthPicker value={month} onChange={setMonth} />
          <Button
            onClick={() => {
              setFormError(null);
              setModal({ mode: "create" });
            }}
            className="whitespace-nowrap px-3 sm:px-4"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              add
            </span>
            <span className="hidden sm:inline">Tambah</span>
            <span className="sr-only sm:hidden">Tambah budget</span>
          </Button>
        </>
      }
    >
      <div className="space-y-md">
        {isLoading && <p className="text-on-surface-variant dark:text-dark-on-surface-variant">Memuat data...</p>}
        {isError && <ErrorState onRetry={refetch} retrying={isRefetching} />}

        {summary && items.length > 0 && (
          <Card className="p-md">
            <div className="flex flex-wrap items-end justify-between gap-sm mb-sm">
              <div>
                <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                  Total terpakai
                </p>
                <p className="tnum text-xl font-semibold">
                  {formatIDR(summary.total_spent)}{" "}
                  <span className="text-body-sm font-normal text-on-surface-variant dark:text-dark-on-surface-variant">
                    dari {formatIDR(summary.total_limit)}
                  </span>
                </p>
              </div>
              <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                Sisa <strong className="tnum text-on-background dark:text-dark-on-background">{formatIDR(summary.total_remaining)}</strong>
              </p>
            </div>
            <div
              role="progressbar"
              aria-valuenow={summary.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Total pemakaian budget bulan ini"
              className="h-2 rounded-full bg-surface-variant dark:bg-dark-surface-variant overflow-hidden"
            >
              <div
                className={`h-full rounded-full ${summary.percentage >= 100 ? "bg-danger dark:bg-dark-danger" : summary.percentage >= 80 ? "bg-warning dark:bg-dark-warning" : "bg-success dark:bg-dark-success"}`}
                style={{ width: `${Math.min(100, summary.percentage)}%` }}
              />
            </div>
          </Card>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {items.map((budget) => {
              const meta = STATUS_META[budget.status];
              return (
                <Card key={budget.id} className="p-md">
                  <div className="flex items-start gap-sm mb-sm">
                    <span className="w-10 h-10 rounded-lg bg-surface-container dark:bg-dark-surface-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant dark:text-dark-on-surface-variant">
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
                    <div className="flex items-center gap-xs shrink-0">
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

                  <div className="flex items-center justify-between text-body-sm">
                    <span className="tnum text-on-surface-variant dark:text-dark-on-surface-variant">
                      {formatIDR(budget.spent)} / {formatIDR(budget.amount_limit)}
                    </span>
                    <span className="tnum font-medium">{budget.percentage}%</span>
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
              description="Tetapkan batas anggaran per kategori. Finora AI akan mengingatkan kalau hampir habis."
              action={
                <Button
                  onClick={() => {
                    setFormError(null);
                    setModal({ mode: "create" });
                  }}
                >
                  Buat Budget
                </Button>
              }
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
