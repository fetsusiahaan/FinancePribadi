// Frontend ngambil IP publik user dari api.ipify.org dan kirim via header
// X-Client-IP (lihat frontend/src/services/api.js) — req.ip di backend gak
// bisa dipakai buat itu karena selalu balikin IP koneksi TCP mentah (loopback
// di dev, atau IP reverse-proxy di production tanpa trust proxy). Fallback ke
// req.ip kalau header gak ada (mis. request tanpa lewat axios interceptor).
export function getClientIp(req) {
  const header = req.headers["x-client-ip"];
  if (typeof header === "string" && header.trim()) return header.trim();
  return req.ip;
}
