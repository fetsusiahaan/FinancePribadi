import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { prisma } from "../config/db.js";
import { signToken } from "../utils/jwt.js";
import { toDto as toTransactionDto } from "./transaction.service.js";
import { logActivity } from "./activityLog.service.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Batas ukuran avatar. Base64 tanpa kompresi: string yang sampai di sini
// sudah ~33% lebih besar dari file aslinya, jadi 8MB di sini ~= foto 6MB.
// Batas ini bukan hiasan -- tanpanya satu request bisa menahan memori server
// selama beberapa MB per koneksi dan membuat baris Postgres membengkak tanpa
// batas atas.
const AVATAR_MAX_BYTES = 8 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function toDto(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    profession: user.profession,
    income_range: user.incomeRange === null ? null : Number(user.incomeRange),
    risk_profile: user.riskProfile,
    preferred_currency: user.preferredCurrency,
    financial_score: user.financialScore,
    // Isi avatar SENGAJA tidak ikut -- lihat komentar di schema.prisma.
    // Yang dikirim cuma penanda ada/tidak, supaya UI tahu harus menampilkan
    // foto atau inisial tanpa harus mengunduh blob-nya lebih dulu.
    has_avatar: !!user.avatar,
    // Dipakai client sebagai cache-buster saat memuat /users/me/avatar:
    // URL yang sama dengan query berbeda memaksa gambar dimuat ulang setelah
    // user mengganti fotonya.
    avatar_updated_at: user.avatar ? user.updatedAt : null,
    created_at: user.createdAt,
  };
}

export async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw httpError("User not found", 404);
  return toDto(user);
}

export async function updateMe(userId, payload, ip) {
  const data = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.phone !== undefined) data.phone = payload.phone || null;
  if (payload.profession !== undefined) data.profession = payload.profession || null;
  if (payload.income_range !== undefined) data.incomeRange = payload.income_range;
  if (payload.risk_profile !== undefined) data.riskProfile = payload.risk_profile || null;
  if (payload.preferred_currency !== undefined) data.preferredCurrency = payload.preferred_currency;

  const user = await userRepository.update(userId, data);
  await logActivity({ userId, action: "profile.updated", ipAddress: ip });
  return toDto(user);
}

/**
 * ETag lemah untuk avatar. `updatedAt` berubah setiap kali baris user disentuh
 * -- termasuk saat user cuma ganti nama -- jadi tag ini bisa berubah walau
 * fotonya sama. Konsekuensinya cuma satu unduhan ekstra yang tidak perlu,
 * bukan foto basi: arah kesalahannya sengaja dipilih yang aman.
 */
function avatarEtag(updatedAt) {
  return `W/"avatar-${new Date(updatedAt).getTime()}"`;
}

export async function getAvatar(userId, ifNoneMatch) {
  const row = await userRepository.findAvatarById(userId);
  if (!row) throw httpError("User not found", 404);
  if (!row.avatar) throw httpError("Avatar not set", 404);

  const etag = avatarEtag(row.updatedAt);

  // Kalau tag klien masih cocok, blob base64-nya (bisa megabyte-an) tidak
  // dikirim sama sekali. Ini pemangkas egress terbesar di aplikasi ini: avatar
  // hampir tidak pernah berubah tapi diminta ulang tiap cold start.
  //
  // `includes`, bukan `===`: If-None-Match sah berisi daftar dipisah koma, dan
  // sebagian proxy menambahi sufiks pada tag lemah.
  if (ifNoneMatch && ifNoneMatch.includes(etag)) {
    return { notModified: true, etag };
  }

  return { avatar: row.avatar, updated_at: row.updatedAt, etag };
}

export async function updateAvatar(userId, avatar, ip) {
  // Format wajib data URI, bukan base64 telanjang: tanpa prefix tipe, client
  // tidak tahu cara merender balik isinya, dan kita tidak punya cara memvalidasi
  // bahwa yang diunggah memang gambar.
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(avatar || "");
  if (!match) throw httpError("Avatar harus berupa data URI base64", 422);

  const [, mimeType, payload] = match;
  if (!AVATAR_ALLOWED_TYPES.includes(mimeType.toLowerCase())) {
    throw httpError("Format gambar harus JPEG, PNG, atau WebP", 422);
  }

  // Panjang string base64, bukan hasil decode: yang membebani memori dan baris
  // Postgres adalah string ini apa adanya.
  if (Buffer.byteLength(payload, "utf8") > AVATAR_MAX_BYTES) {
    throw httpError("Ukuran foto melebihi 8MB", 413);
  }

  // Payload harus base64 sah. Tanpa cek ini, string sampah apa pun bisa
  // tersimpan dan baru ketahuan rusak saat gambar gagal dirender di client.
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) {
    throw httpError("Data gambar tidak valid", 422);
  }

  const user = await userRepository.update(userId, { avatar });
  await logActivity({ userId, action: "profile.avatar_updated", ipAddress: ip });
  return toDto(user);
}

export async function deleteAvatar(userId, ip) {
  const user = await userRepository.update(userId, { avatar: null });
  await logActivity({ userId, action: "profile.avatar_removed", ipAddress: ip });
  return toDto(user);
}

export async function changePassword(userId, { current_password, new_password }) {
  const user = await userRepository.findById(userId);
  if (!user) throw httpError("User not found", 404);
  if (!user.passwordHash || !(await bcrypt.compare(current_password, user.passwordHash))) {
    throw httpError("Password saat ini salah", 401);
  }
  const passwordHash = await bcrypt.hash(new_password, 10);
  await userRepository.update(userId, { passwordHash });
  const token = signToken({ sub: userId });
  return { token };
}

export async function deleteMe(userId, { password }) {
  const user = await userRepository.findById(userId);
  if (!user) throw httpError("User not found", 404);
  if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError("Password salah", 401);
  }
  await userRepository.remove(userId);
}

export async function exportData(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw httpError("User not found", 404);

  const [transactions, budgets, categories] = await Promise.all([
    prisma.transaction.findMany({ where: { userId }, include: { category: true }, orderBy: { date: "desc" } }),
    prisma.budget.findMany({ where: { userId }, include: { category: true }, orderBy: { monthYear: "desc" } }),
    prisma.category.findMany({ where: { userId } }),
  ]);

  return {
    user: toDto(user),
    transactions: transactions.map(toTransactionDto),
    budgets: budgets.map((b) => ({
      id: b.id,
      amount_limit: Number(b.amountLimit),
      month_year: b.monthYear.toISOString().slice(0, 10),
      category: b.category?.name,
    })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type, icon: c.icon })),
  };
}
