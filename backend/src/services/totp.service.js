import { authenticator } from "otplib";
import QRCode from "qrcode";
import { env } from "../config/env.js";

const ISSUER = env.totpIssuer || "Finora AI";

export function generateSecret(email) {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, ISSUER, secret);
  return { secret, otpauthUrl };
}

export function toQrDataUri(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyCode(secret, code) {
  try {
    return authenticator.check(code, secret);
  } catch {
    return false;
  }
}
