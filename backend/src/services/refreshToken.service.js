import crypto from "crypto";
import { refreshTokenRepository } from "../repositories/refreshToken.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { signToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function issueRefreshToken(userId) {
  const rawToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + env.refreshTokenExpiresDays * 24 * 60 * 60 * 1000);
  await refreshTokenRepository.create({ userId, tokenHash: hashToken(rawToken), expiresAt });
  return rawToken;
}

export async function rotateRefreshToken(rawToken) {
  const record = await refreshTokenRepository.findValidByHash(hashToken(rawToken));
  if (!record) throw httpError("Invalid or expired refresh token", 401);

  await refreshTokenRepository.revoke(record.id);

  const user = await userRepository.findById(record.userId);
  if (!user) throw httpError("User not found", 404);
  if (user.isSuspended) throw httpError("Account suspended", 403);

  const token = signToken({ sub: user.id, role: user.role });
  const refresh_token = await issueRefreshToken(user.id);
  return { token, refresh_token };
}

export async function revokeRefreshToken(rawToken) {
  const record = await refreshTokenRepository.findByHash(hashToken(rawToken));
  if (record && !record.revokedAt) await refreshTokenRepository.revoke(record.id);
}
