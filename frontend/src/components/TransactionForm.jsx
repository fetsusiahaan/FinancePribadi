import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import { getCategories } from "../services/category.service";
import { todayValue, formatThousands, stripThousands } from "../utils/format";

const emptyForm = { type: "EXPENSE", amount: "", date: todayValue(), category_id: "", description: "", is_recurring: false };

export function TransactionForm({ initial, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          type: initial.category?.type || "EXPENSE",
          amount: String(initial.amount),
          date: initial.date,
          category_id: initial.category?.id || "",
          description: initial.description || "",
          is_recurring: initial.is_recurring,
        }
      : emptyForm
  );

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });

  const filtered = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);

  // Kalau tipe berganti, kategori lama jadi tidak valid — reset ke pilihan pertama.
  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.some((c) => c.id === form.category_id)) {
      setForm((prev) => ({ ...prev, category_id: filtered[0].id }));
    }
  }, [filtered, form.category_id]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      amount: Number(form.amount),
      date: form.date,
      category_id: form.category_id,
      description: form.description.trim() || null,
      is_recurring: form.is_recurring,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-md">
      {/* Toggle tipe = kontrol pilihan, jadi diberi role radiogroup agar
          pembaca layar mengumumkan mana yang sedang terpilih. */}
      <div
        role="radiogroup"
        aria-label="Tipe transaksi"
        className="grid grid-cols-2 gap-xs p-xs bg-surface-container dark:bg-dark-surface-container rounded-lg"
      >
        {[
          { value: "EXPENSE", label: "Pengeluaran", icon: "trending_down" },
          { value: "INCOME", label: "Pemasukan", icon: "trending_up" },
        ].map((option) => {
          const selected = form.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setForm({ ...form, type: option.value })}
              className={`flex items-center justify-center gap-xs min-h-11 rounded-md text-body-sm font-medium cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected
                  ? "bg-surface-container-lowest dark:bg-dark-surface-container-lowest shadow-sm text-primary"
                  : "text-on-surface-variant dark:text-dark-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {option.icon}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="amount">
          Jumlah (Rp)
        </label>
        <Input
          id="amount"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          placeholder="50.000"
          aria-describedby="amount-help"
          className="tnum"
          value={formatThousands(form.amount)}
          onChange={(e) => setForm({ ...form, amount: stripThousands(e.target.value) })}
        />
        <p id="amount-help" className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          Titik ribuan otomatis mengikuti angka yang kamu ketik.
        </p>
      </div>

      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="category">
          Kategori
        </label>
        <Select
          id="category"
          required
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          <option value="" disabled>
            Pilih kategori
          </option>
          {filtered.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="date">
          Tanggal
        </label>
        <Input
          id="date"
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </div>

      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="description">
          Keterangan (opsional)
        </label>
        <Input
          id="description"
          type="text"
          placeholder="Makan siang"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      {/* min-h-11 pada label memperluas area sentuh checkbox yang secara visual kecil. */}
      <label className="flex items-center gap-sm min-h-11 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_recurring}
          onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
          className="w-5 h-5 rounded cursor-pointer border-outline-variant dark:border-dark-outline-variant text-primary focus-visible:ring-2 focus-visible:ring-primary"
        />
        <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          Transaksi berulang tiap bulan
        </span>
      </label>

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
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
