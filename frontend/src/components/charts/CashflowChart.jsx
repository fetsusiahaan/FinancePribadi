import { formatCompactIDR, formatIDR, formatMonthLabel } from "../../utils/format";

/** Bar chart income vs expense per bulan (PRD §Dashboard Layout: Cash Flow). */
export function CashflowChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
        Belum ada data cash flow.
      </p>
    );
  }

  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);

  return (
    <div>
      <div className="flex items-end justify-between gap-sm h-40">
        {data.map((point) => (
          <div key={point.month} className="flex-1 flex flex-col items-center gap-xs h-full justify-end">
            <div className="w-full flex items-end justify-center gap-[3px] h-full">
              <div
                className="w-1/3 min-h-[2px] bg-success dark:bg-dark-success rounded-t"
                style={{ height: `${(point.income / max) * 100}%` }}
                title={`Pemasukan ${formatCompactIDR(point.income)}`}
              />
              {/* Pengeluaran dibedakan warna DAN pola garis, supaya tetap
                  terbaca tanpa membedakan warna. */}
              <div
                className="w-1/3 min-h-[2px] bg-danger dark:bg-dark-danger rounded-t bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.35)_3px,rgba(255,255,255,0.35)_6px)]"
                style={{ height: `${(point.expense / max) * 100}%` }}
                title={`Pengeluaran ${formatCompactIDR(point.expense)}`}
              />
            </div>
            <span className="tnum text-[11px] text-on-surface-variant dark:text-dark-on-surface-variant">
              {point.month.slice(5)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-md mt-sm text-body-sm">
        <span className="flex items-center gap-xs text-on-surface-variant dark:text-dark-on-surface-variant">
          <span className="w-3 h-3 rounded-sm bg-success dark:bg-dark-success" aria-hidden="true" /> Pemasukan
        </span>
        <span className="flex items-center gap-xs text-on-surface-variant dark:text-dark-on-surface-variant">
          <span
            className="w-3 h-3 rounded-sm bg-danger dark:bg-dark-danger bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.45)_2px,rgba(255,255,255,0.45)_4px)]"
            aria-hidden="true"
          />{" "}
          Pengeluaran
        </span>
      </div>

      {/* Tabel alternatif: nilai pasti tetap tersedia lewat keyboard dan
          pembaca layar, tidak hanya lewat hover pada batang. */}
      <details className="mt-sm">
        <summary className="cursor-pointer text-body-sm text-primary font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
          Lihat data cash flow
        </summary>
        <table className="w-full mt-sm text-body-sm">
          <caption className="sr-only">Pemasukan dan pengeluaran per bulan</caption>
          <thead>
            <tr className="text-on-surface-variant dark:text-dark-on-surface-variant">
              <th scope="col" className="text-left font-medium py-xs">
                Bulan
              </th>
              <th scope="col" className="text-right font-medium py-xs">
                Pemasukan
              </th>
              <th scope="col" className="text-right font-medium py-xs">
                Pengeluaran
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
            {data.map((point) => (
              <tr key={point.month}>
                <th scope="row" className="text-left font-normal py-xs">
                  {formatMonthLabel(point.month)}
                </th>
                <td className="tnum text-right py-xs">{formatIDR(point.income)}</td>
                <td className="tnum text-right py-xs">{formatIDR(point.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
