/**
 * Helper periode bulanan. Query param `month` berformat "YYYY-MM" (lihat API.md §2).
 * Semua tanggal transaksi disimpan sebagai kolom DATE, jadi rentang dihitung dalam UTC.
 */
export function parseMonth(month) {
  const now = new Date();
  let year = now.getUTCFullYear();
  let monthIndex = now.getUTCMonth();

  if (typeof month === "string" && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      monthIndex = m - 1;
    }
  }

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  const label = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  return { start, end, label, year, monthIndex };
}

export function previousMonth({ year, monthIndex }) {
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
  return { start, end };
}
