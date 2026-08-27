import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { userRepository } from "../repositories/user.repository.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
import * as totpService from "./totp.service.js";
import { logActivity } from "./activityLog.service.js";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from "./refreshToken.service.js";

const googleClient = new OAuth2Client(env.googleWebClientId);

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function verifyChallengeToken(challengeToken) {
  let payload;
  try {
    payload = verifyToken(challengeToken);
  } catch {
    throw httpError("Invalid or expired challenge token", 401);
  }
  if (payload.typ !== "2fa_challenge") throw httpError("Invalid challenge token", 401);
  return payload;
}

// Identitas Google yang SUDAH terverifikasi tapi BELUM punya baris di database.
// Dititipkan ke client sebagai JWT bertanda tangan, bukan disimpan sebagai user
// setengah jadi -- kalau user membatalkan di layar "Amankan Akunmu", tidak ada
// sampah yang tertinggal di tabel users.
//
// Ditandatangani dengan JWT_SECRET yang sama seperti token lain, jadi client
// tidak bisa mengarang email/googleId sendiri. Umur 15 menit: cukup untuk
// mengetik password, terlalu pendek untuk dipakai ulang kalau bocor.
function signGoogleSignupToken({ googleId, email, name }) {
  return signToken({ typ: "google_signup", googleId, email, name }, { expiresIn: "15m" });
}

export function verifyGoogleSignupToken(signupToken) {
  let payload;
  try {
    payload = verifyToken(signupToken);
  } catch {
    throw httpError("Invalid or expired signup token", 401);
  }
  if (payload.typ !== "google_signup") throw httpError("Invalid signup token", 401);
  return payload;
}

async function issueSession(user, ip) {
  if (user.role !== "ADMIN") {
    const token = signToken({ sub: user.id, role: user.role });
    const refresh_token = await issueRefreshToken(user.id);
    await logActivity({ userId: user.id, action: "auth.login", ipAddress: ip });
    return { status: "ok", user_id: user.id, token, refresh_token };
  }

  const challengeToken = signToken({ sub: user.id, typ: "2fa_challenge" }, { expiresIn: "5m" });
  if (!user.twoFactorEnabled) {
    return { status: "2fa_setup_required", challenge_token: challengeToken };
  }
  return { status: "2fa_required", challenge_token: challengeToken };
}

export async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw httpError("Email already registered", 409);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.create({ name, email, passwordHash });
  const token = signToken({ sub: user.id, role: user.role });
  const refresh_token = await issueRefreshToken(user.id);
  return { user_id: user.id, token, refresh_token };
}

export async function login({ email, password }, ip) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError("Invalid email or password", 401);
  }
  if (user.isSuspended) {
    throw httpError("Account suspended", 403);
  }

  return issueSession(user, ip);
}

export async function loginWithGoogle({ id_token }, ip) {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: env.googleWebClientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw httpError("Invalid or expired Google token", 401);
  }

  if (!payload?.email) throw httpError("Google account has no email", 401);
  if (!payload.email_verified) throw httpError("Google email not verified", 401);

  let user = await userRepository.findByGoogleId(payload.sub);

  // Email cocok dengan akun password yang sudah ada -> tautkan. Aman karena
  // email_verified sudah dicek di atas: Google menjamin pemilik email ini.
  if (!user) {
    user = await userRepository.findByEmail(payload.email);
    if (user) user = await userRepository.update(user.id, { googleId: payload.sub });
  }

  // Belum ada barisnya sama sekali. SENGAJA tidak membuat user di sini:
  // pendaftaran baru dianggap selesai hanya setelah password diisi
  // (POST /auth/google/complete). Identitasnya dititipkan ke client sebagai
  // signup_token bertanda tangan, jadi membatalkan di layar password tidak
  // meninggalkan baris passwordHash NULL di database.
  if (!user) {
    return {
      status: "signup_required",
      signup_token: signGoogleSignupToken({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
      }),
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
    };
  }

  if (user.isSuspended) throw httpError("Account suspended", 403);

  return issueSession(user, ip);
}

// Menutup alur di atas: membuat user sungguhan setelah password diisi.
// Ini satu-satunya jalan sebuah akun Google baru masuk ke tabel users.
export async function completeGoogleSignup({ signup_token, password }, ip) {
  const payload = verifyGoogleSignupToken(signup_token);

  // Kondisi bisa berubah selama 15 menit umur token: akun dengan email yang
  // sama mungkin dibuat lewat jalur lain. Cek ulang, jangan percaya keadaan
  // saat token diterbitkan.
  const existingByGoogle = await userRepository.findByGoogleId(payload.googleId);
  if (existingByGoogle) return issueSession(existingByGoogle, ip);

  const existingByEmail = await userRepository.findByEmail(payload.email);
  if (existingByEmail) {
    const linked = await userRepository.update(existingByEmail.id, { googleId: payload.googleId });
    return issueSession(linked, ip);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await userRepository.create({
      name: payload.name,
      email: payload.email,
      googleId: payload.googleId,
      passwordHash,
    });
  } catch (err) {
    // Dua request nyaris bersamaan (double-tap): satu menang, satu kena unique
    // constraint. Yang kalah melanjutkan sebagai user yang sudah terlanjur
    // dibuat, bukan melempar error ke user.
    if (err.code !== "P2002") throw err;
    user = await userRepository.findByEmail(payload.email);
    if (!user) throw err;
  }

  return issueSession(user, ip);
}

export async function verifyLoginTwoFactor({ challenge_token, code }, ip) {
  const payload = verifyChallengeToken(challenge_token);
  const user = await userRepository.findById(payload.sub);
  if (!user || !user.twoFactorEnabled) throw httpError("2FA not enabled", 400);
  if (!totpService.verifyCode(user.twoFactorSecret, code)) throw httpError("Invalid code", 401);
  const token = signToken({ sub: user.id, role: user.role });
  const refresh_token = await issueRefreshToken(user.id);
  await logActivity({ userId: user.id, action: "auth.login", ipAddress: ip });
  return { user_id: user.id, token, refresh_token };
}

export async function setupTwoFactor(challenge_token) {
  const payload = verifyChallengeToken(challenge_token);
  const user = await userRepository.findById(payload.sub);
  if (!user) throw httpError("User not found", 404);
  const { secret, otpauthUrl } = totpService.generateSecret(user.email);
  await userRepository.update(payload.sub, { twoFactorSecret: secret });
  const qr_code = await totpService.toQrDataUri(otpauthUrl);
  return { qr_code, secret };
}

export async function confirmTwoFactorSetup({ challenge_token, code }) {
  const payload = verifyChallengeToken(challenge_token);
  const user = await userRepository.findById(payload.sub);
  if (!user || !user.twoFactorSecret) throw httpError("2FA setup not started", 400);
  if (!totpService.verifyCode(user.twoFactorSecret, code)) throw httpError("Invalid code", 401);
  await userRepository.update(user.id, { twoFactorEnabled: true });
  const token = signToken({ sub: user.id, role: user.role });
  const refresh_token = await issueRefreshToken(user.id);
  return { user_id: user.id, token, refresh_token };
}

export async function refreshAccessToken(refreshToken) {
  return rotateRefreshToken(refreshToken);
}

export async function logout(refreshToken) {
  await revokeRefreshToken(refreshToken);
}
