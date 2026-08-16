import { formatIDR } from "../../utils/format";

// Palet kategorikal: urutan dipilih supaya warna bertetangga tetap berbeda
// dalam nilai (value), bukan hanya rona (hue) — aman untuk buta warna.
const PALETTE = ["#2563eb", "#10b981", "#a855f7", "#c2410c", "#0891b2", "#be185d", "#4d7c0f", "#7c3aed"];

/** Pie/Donut Chart untuk Expense Category (PRD §Dashboard Layout). */
export function DonutChart({ data, size = 160, thickness = 22 }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  if (total <= 0) return null;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const top = data[0];
  const summary = `Donut pengeluaran per kategori. Total ${formatIDR(total)} dari ${data.length} kategori. Terbesar: ${top.name} ${formatIDR(top.amount)} (${Math.round((top.amount / total) * 100)}%).`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-md">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={summary}
        className="shrink-0 -rotate-90"
      >
        {data.map((slice, i) => {
          const fraction = slice.amount / total;
          const dash = fraction * circumference;
          const el = (
            <circle
              key={slice.category_id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>

      {/* Legenda ini juga berfungsi sebagai tabel nilai — grafik tidak
          bergantung pada hover untuk menyampaikan angka. */}
      <ul className="flex-1 w-full space-y-xs">
        {data.map((slice, i) => (
          <li key={slice.category_id} className="flex items-center gap-sm text-body-sm">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-on-surface-variant dark:text-dark-on-surface-variant">
              {slice.name}
            </span>
            <span className="tnum font-medium text-on-background dark:text-dark-on-background whitespace-nowrap">
              {formatIDR(slice.amount)}
            </span>
            <span className="tnum w-10 text-right text-on-surface-variant dark:text-dark-on-surface-variant">
              {Math.round((slice.amount / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
