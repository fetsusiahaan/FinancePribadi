import "dotenv/config";

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30,
  
  // Jarak minimum antar-sapuan pembersih (refresh_tokens + activity_logs).
  // Pembersihnya dibonceng GET /health, yang di-ping tiap 45 detik per klien —
  // tanpa jeda ini satu perangkat aktif saja sudah memicu ribuan DELETE
  // per hari.
  //
  // Ini yang menentukan seberapa cepat baris mati benar-benar hilang, bukan
  // masa tenggang di bawah. Tenggang 1 menit dengan sapuan tiap 60 menit tetap
  // berarti menunggu satu jam. Angka-angka ini harus dipilih bersama.
  cleanupIntervalMinutes:
    Number(process.env.CLEANUP_INTERVAL_MINUTES ?? process.env.REFRESH_TOKEN_CLEANUP_INTERVAL_MINUTES) ||
    5,
  
  
  refreshTokenRevokedGraceMinutes:
    Number(process.env.REFRESH_TOKEN_REVOKED_GRACE_MINUTES ?? 30),
  // Umur maksimum baris activity_logs. Lewat itu dihapus permanen oleh
  // pembersih yang sama di GET /health.
  //
  // Ini kebijakan retensi audit, bukan sekadar housekeeping seperti
  // refresh_tokens: baris yang dibuang di sini masih SAH dan masih terbaca di
  // panel admin sampai detik penghapusannya. Menaikkan angkanya tidak
  // mengembalikan yang sudah hilang.
  activityLogRetentionDays: Number(process.env.ACTIVITY_LOG_RETENTION_DAYS) || 5,
  totpIssuer: process.env.TOTP_ISSUER || "Finetra AI",
  googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
};
