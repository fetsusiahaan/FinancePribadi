import crypto from "crypto";
import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { transactionRepository } from "../repositories/transaction.repository.js";
import * as budgetService from "./budget.service.js";
import * as planService from "./plan.service.js";
import { prisma } from "../config/db.js";
import { parseMonth, previousMonth, nowInJakarta, asTimestampBound } from "../utils/period.js";

/**
 * Batas "hari ini" menurut kalender Jakarta, bukan UTC.
 *
 * Dulu memakai `new Date()` mentah, sehingga antara pukul 00:00 dan 07:00 WIB
 * "hari ini" masih menunjuk tanggal kemarin. Akibatnya angka "transaksi hari
 * ini" dan "user baru hari ini" di panel admin kosong sepanjang pagi buta lalu
 * melompat pukul 07:00 -- terlihat seperti data hilang, padahal batasnya yang
 * salah.
 *
 * Batasnya sendiri tetap tengah malam UTC karena dibandingkan dengan kolom
 * DATE dan dengan created_at; yang berubah cuma TANGGAL mana yang dianggap
 * hari ini.
 */
function todayRange() {
  const now = nowInJakarta();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return { start, end };
}

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
    ...planService.toPlanDto(user.plan ?? null),
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

export async function getOverview() {
  const { start: todayStart, end: todayEnd } = todayRange();
  const thisMonth = parseMonth();
  const lastMonth = previousMonth(thisMonth);

  // Batas yang sama, dua bentuk. `transactions.date` bertipe DATE dan memakai
  // batas kalender apa adanya; `users.created_at` bertipe TIMESTAMP yang
  // digeser timezone.js, jadi batasnya harus dikonversi lebih dulu. Memakai
  // satu bentuk untuk keduanya membuat salah satunya meleset 7 jam --
  // lihat asTimestampBound() di utils/period.js.
  const todayStartTs = asTimestampBound(todayStart);
  const todayEndTs = asTimestampBound(todayEnd);
  const thisMonthTs = { start: asTimestampBound(thisMonth.start), end: asTimestampBound(thisMonth.end) };
  const lastMonthTs = { start: asTimestampBound(lastMonth.start), end: asTimestampBound(lastMonth.end) };

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    newUsersToday,
    newUsersThisMonth,
    newUsersLastMonth,
    totalTransactions,
    transactionsToday,
    totalValue,
    income,
    expense,
    goalsCount,
  ] = await Promise.all([
    userRepository.count(),
    userRepository.countBySuspended(false),
    userRepository.countBySuspended(true),
    userRepository.countCreatedBetween(todayStartTs, todayEndTs),
    userRepository.countCreatedBetween(thisMonthTs.start, thisMonthTs.end),
    userRepository.countCreatedBetween(lastMonthTs.start, lastMonthTs.end),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { date: { gte: todayStart, lt: todayEnd } } }),
    prisma.transaction.aggregate({ _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { category: { type: "INCOME" } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { category: { type: "EXPENSE" } }, _sum: { amount: true } }),
    prisma.savingsGoal.count(),
  ]);

  const growthPercent =
    newUsersLastMonth > 0
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 1000) / 10
      : 0;

  return {
    kpi: {
      total_users: totalUsers,
      active_users: activeUsers,
      new_users_today: newUsersToday,
      total_transactions: totalTransactions,
      total_transaction_value: Number(totalValue._sum.amount || 0),
      ai_requests_today: null,
      ai_cost_today: null,
      monthly_revenue: null,
    },
    user_summary: {
      total_users: totalUsers,
      active_users: activeUsers,
      new_users_today: newUsersToday,
      suspended_users: suspendedUsers,
      growth_percent: growthPercent,
    },
    finance_summary: {
      transactions_today: transactionsToday,
      total_value: Number(totalValue._sum.amount || 0),
      income: Number(income._sum.amount || 0),
      expense: Number(expense._sum.amount || 0),
      accounts_count: null,
      goals_count: goalsCount,
    },
    ai_summary: null,
    subscription_summary: await planService.summarizeTiers(totalUsers),
    recent_activity: null,
    system_alerts: null,
  };
}

export async function updateTier(actorId, targetId, { tier, note }) {
  const target = await userRepository.findById(targetId);
  if (!target) throw httpError("User not found", 404);
  return planService.setTier(actorId, targetId, { tier, note });
}

export async function listPlanGrants(targetId) {
  const target = await userRepository.findById(targetId);
  if (!target) throw httpError("User not found", 404);
  return { items: await planService.listGrants(targetId) };
}

/**
 * Isi halaman Subscription > Plans: daftar akun berbayar + ringkasan hitungan.
 *
 * Ringkasannya ikut di sini, bukan diambil ulang dari /admin/overview, karena
 * halaman ini tidak boleh memaksa pemanggilnya menembak dua endpoint dan
 * merakit sendiri -- dan ringkasan yang datang dari respons berbeda bisa
 * terbaca dari titik waktu berbeda dengan daftarnya.
 *
 * Yang TIDAK ada di sini: katalog paket yang bisa diedit (harga, limit). Belum
 * ada harga di mana pun dan TIER_LIMITS sengaja masih kosong; halaman ini
 * menampilkan siapa berlangganan apa, bukan mengatur apa isi paketnya.
 */
export async function listPlans({ page = 1, pageSize = 20, tier = null } = {}) {
  const [accounts, totalUsers] = await Promise.all([
    planService.listGrantedAccounts({ page, pageSize, tier }),
    userRepository.count({ search: "" }),
  ]);
  return { ...accounts, summary: await planService.summarizeTiers(totalUsers) };
}

export async function resetPassword(targetId) {
  const target = await userRepository.findById(targetId);
  if (!target) throw httpError("User not found", 404);

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await userRepository.update(targetId, { passwordHash });
  return { temp_password: tempPassword };
}
