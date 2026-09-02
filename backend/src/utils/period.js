/**
 * Helper periode bulanan. Query param `month` berformat "YYYY-MM" (lihat API.md §2).
 *
 * Tanggal transaksi disimpan sebagai kolom DATE (tanpa jam), jadi BATAS
 * rentangnya tetap dihitung dalam UTC -- `Date.UTC(2026, 8, 1)` menghasilkan
 * tengah malam UTC, yang persis cara nilai kolom DATE itu ditulis di
 * transaction.service.js (`new Date(\`${date}T00:00:00.000Z\`)`). Mengubahnya
 * ke waktu lokal akan menggeser batas rentang 7 jam dari nilai yang tersimpan
 * dan membuat transaksi tanggal 1 dan tanggal terakhir bulan itu bocor keluar
 * rentangnya.
 *
 * Yang HARUS memakai waktu Jakarta adalah penentuan "bulan ini" dan "hari ini"
 * -- lihat nowInJakarta() di bawah.
 */

// Indonesia tidak memakai DST, jadi offset tetap +7 selalu benar.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * "Sekarang" menurut jam dinding Jakarta, dibungkus sebagai Date supaya
 * getUTC*() padanya mengembalikan komponen tanggal WIB.
 *
 * Dipakai HANYA untuk menjawab "hari/bulan apa sekarang", bukan untuk disimpan
 * ke database. Tanpa ini, user yang membuka aplikasi pukul 00:00-07:00 WIB
 * masih dihitung berada di hari sebelumnya: transaksi yang baru saja ia catat
 * tidak muncul di angka "hari ini", dan pada tanggal 1 pukul 06:00 seluruh
 * dashboard menampilkan bulan yang sudah lewat. Diverifikasi, bukan dugaan.
 */
export function nowInJakarta() {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

/**
 * Ubah batas kalender menjadi bentuk yang benar untuk kolom TIMESTAMP.
 *
 * Ada DUA jenis kolom waktu di skema ini, dan batas rentang yang sama TIDAK
 * berlaku untuk keduanya:
 *
 *   kolom DATE (transactions.date, budgets.month_year, ...)
 *     Tidak ikut digeser timezone.js. Nilainya ditulis sebagai tengah malam
 *     UTC. Batasnya = Date.UTC(y, m, d) apa adanya.
 *
 *   kolom TIMESTAMP (users.created_at, activity_logs.created_at, ...)
 *     Digeser +7 jam oleh timezone.js sebelum sampai ke database. Kalau batas
 *     kalender dikirim apa adanya, extension menambahkan 7 jam lagi dan
 *     batasnya mendarat di pukul 07:00, bukan tengah malam.
 *
 * Fungsi ini mengurangi 7 jam lebih dulu supaya setelah digeser extension
 * hasilnya kembali tepat tengah malam WIB. Diverifikasi: tanpa ini, "user baru
 * hari ini" melewatkan setiap pendaftaran antara 00:00 dan 07:00 WIB.
 *
 * Terlihat seperti kerumitan yang tidak perlu, dan memang begitu -- ini harga
 * dari menyimpan jam WIB di kolom tanpa zona. Yang menghapus kerumitan ini
 * adalah timestamptz, bukan menghapus fungsi ini.
 */
export const asTimestampBound = (calendarDate) =>
  new Date(calendarDate.getTime() - WIB_OFFSET_MS);

export function parseMonth(month) {
  const now = nowInJakarta();
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
