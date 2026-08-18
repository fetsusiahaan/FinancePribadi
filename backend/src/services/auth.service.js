import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import * as totpService from "./totp.service.js";

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

export async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw httpError("Email already registered", 409);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.create({ name, email, passwordHash });
  const token = signToken({ sub: user.id, role: user.role });
  return { user_id: user.id, token };
}

export async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError("Invalid email or password", 401);
  }
  if (user.isSuspended) {
    throw httpError("Account suspended", 403);
  }

  if (user.role !== "ADMIN") {
    const token = signToken({ sub: user.id, role: user.role });
    return { status: "ok", user_id: user.id, token };
  }

  const challengeToken = signToken({ sub: user.id, typ: "2fa_challenge" }, { expiresIn: "5m" });
  if (!user.twoFactorEnabled) {
    return { status: "2fa_setup_required", challenge_token: challengeToken };
  }
  return { status: "2fa_required", challenge_token: challengeToken };
}

export async function verifyLoginTwoFactor({ challenge_token, code }) {
  const payload = verifyChallengeToken(challenge_token);
  const user = await userRepository.findById(payload.sub);
  if (!user || !user.twoFactorEnabled) throw httpError("2FA not enabled", 400);
  if (!totpService.verifyCode(user.twoFactorSecret, code)) throw httpError("Invalid code", 401);
  const token = signToken({ sub: user.id, role: user.role });
  return { user_id: user.id, token };
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
  return { user_id: user.id, token };
}
