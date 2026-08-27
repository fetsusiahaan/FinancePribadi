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
