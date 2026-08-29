import "dotenv/config";

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30,
  
  refreshTokenCleanupIntervalMinutes:
    Number(process.env.REFRESH_TOKEN_CLEANUP_INTERVAL_MINUTES) || 5,
  
  
  refreshTokenRevokedGraceMinutes:
    Number(process.env.REFRESH_TOKEN_REVOKED_GRACE_MINUTES ?? 30),
  totpIssuer: process.env.TOTP_ISSUER || "Finetra AI",
  googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
};
