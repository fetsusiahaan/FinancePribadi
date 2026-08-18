import crypto from "crypto";
import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { transactionRepository } from "../repositories/transaction.repository.js";
import * as budgetService from "./budget.service.js";
import { prisma } from "../config/db.js";
import { parseMonth } from "../utils/period.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function toUserDto(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_suspended: user.isSuspended,
    financial_score: user.financialScore,
    created_at: user.createdAt,
  };
}

export async function listUsers({ page = 1, pageSize = 20, search = "" } = {}) {
  const skip = (page - 1) * pageSize;
  const [users, total] = await Promise.all([
    userRepository.findAllPaginated({ skip, take: pageSize, search }),
    userRepository.count({ search }),
  ]);
  return {
    items: users.map(toUserDto),
    page,
    page_size: pageSize,
    total,
  };
}

export async function getUserDetail(id) {
  const user = await userRepository.findById(id);
  if (!user) throw httpError("User not found", 404);

  const range = parseMonth();
  const wideStart = new Date(0);
  const wideEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [txCount, allTimeIncome, allTimeExpense, currentBudgets] = await Promise.all([
    prisma.transaction.count({ where: { userId: id } }),
    transactionRepository.sumByType(id, "INCOME", wideStart, wideEnd),
    transactionRepository.sumByType(id, "EXPENSE", wideStart, wideEnd),
    budgetService.list(id, range.label),
  ]);

  return {
    user: toUserDto(user),
    financial_summary: {
      transaction_count: txCount,
      all_time_income: Number(allTimeIncome._sum.amount || 0),
      all_time_expense: Number(allTimeExpense._sum.amount || 0),
      current_month: currentBudgets,
    },
  };
}

export async function updateRole(actorId, targetId, role) {
  if (actorId === targetId) throw httpError("Cannot change own role", 400);
  const target = await userRepository.findById(targetId);
  if (!target) throw httpError("User not found", 404);

  if (role !== "ADMIN" && target.role === "ADMIN") {
    const adminCount = await userRepository.countByRole("ADMIN");
    if (adminCount <= 1) throw httpError("Cannot demote the last admin", 400);
  }

  const user = await userRepository.update(targetId, { role });
  return toUserDto(user);
}

export async function updateSuspend(actorId, targetId, isSuspended) {
  if (actorId === targetId) throw httpError("Cannot suspend your own account", 400);
  const target = await userRepository.findById(targetId);
  if (!target) throw httpError("User not found", 404);

  const user = await userRepository.update(targetId, { isSuspended });
  return toUserDto(user);
}

export async function deleteUser(actorId, targetId) {
  if (actorId === targetId) throw httpError("Cannot delete your own account", 400);
  const target = await userRepository.findById(targetId);
  if (!target) throw httpError("User not found", 404);
  await userRepository.remove(targetId);
}

export async function resetPassword(targetId) {
  const target = await userRepository.findById(targetId);
  if (!target) throw httpError("User not found", 404);

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await userRepository.update(targetId, { passwordHash });
  return { temp_password: tempPassword };
}
