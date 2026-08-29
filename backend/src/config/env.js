import "dotenv/config";

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30,
  
  refreshTokenCleanupIntervalMinutes:
    Number(process.env.REFRESH_TOKEN_CLEANUP_INTERVAL_MINUTES) || 60,
  
  refreshTokenRevokedGraceDays: Number(process.env.REFRESH_TOKEN_REVOKED_GRACE_DAYS) || 1,
  totpIssuer: process.env.TOTP_ISSUER || "Finetra AI",
  googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
};
