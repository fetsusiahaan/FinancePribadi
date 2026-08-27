import "dotenv/config";

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30,
  totpIssuer: process.env.TOTP_ISSUER || "Finora AI",
  googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
};
