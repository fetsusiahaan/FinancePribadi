import { formatMonthLabel } from "../../utils/format";

function shift(monthValue, delta) {
  const [year, month] = monthValue.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const NAV_BUTTON =
  "w-11 h-11 flex items-center justify-center rounded-md cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-high dark:hover:bg-dark-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors";

export function MonthPicker({ value, onChange }) {
  return (
    <div
      role="group"
      aria-label="Pilih bulan"
      className="flex items-center gap-xs bg-surface-container dark:bg-dark-surface-container rounded-lg px-xs"
    >
      <button
        type="button"
        aria-label="Bulan sebelumnya"
        onClick={() => onChange(shift(value, -1))}
        className={NAV_BUTTON}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          chevron_left
        </span>
      </button>
      {/* aria-live agar perubahan bulan diumumkan tanpa memindahkan fokus keyboard. */}
      <span
        aria-live="polite"
        className="text-body-sm font-medium min-w-[130px] text-center text-on-background dark:text-dark-on-background"
      >
        {formatMonthLabel(value)}
      </span>
      <button
        type="button"
        aria-label="Bulan berikutnya"
        onClick={() => onChange(shift(value, 1))}
        className={NAV_BUTTON}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          chevron_right
        </span>
      </button>
    </div>
  );
}
