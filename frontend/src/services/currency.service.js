// API publik gratis, tanpa API key — bukan lewat instance `api` (itu khusus
// baseURL internal /api/v1), panggilan ke domain eksternal pakai fetch langsung.
export async function getUsdToIdrRate() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("Gagal mengambil kurs");
  const data = await res.json();
  const rate = data?.rates?.IDR;
  if (!rate) throw new Error("Kurs IDR tidak ditemukan");
  return rate;
}
