import { prisma } from "../config/db.js";
import { transactionRepository } from "../repositories/transaction.repository.js";
import { parseMonth, previousMonth } from "../utils/period.js";
import { toDto as transactionDto } from "./transaction.service.js";
import * as budgetService from "./budget.service.js";
import { calculateScore } from "./financialScore.service.js";

/**
 * Insight rule-based sebagai placeholder AI Spending Insight (PRD §11).
 * Diganti panggilan LLM di Sprint 3.
 */
function buildInsight({ income, expense, budgets, expenseByCategory, previousExpense }) {
  if (income === 0 && expense === 0) {
    return "Belum ada transaksi bulan ini. Mulai catat pemasukan dan pengeluaran supaya Finora AI bisa menganalisis keuanganmu.";
  }

  const exceeded = budgets.filter((b) => b.status === "EXCEEDED");
  if (exceeded.length > 0) {
    const names = exceeded.map((b) => b.category?.name).filter(Boolean).join(", ");
    return `Budget ${names} sudah terlampaui bulan ini. Tahan pengeluaran di kategori tersebut sampai akhir bulan.`;
  }

  const warning = budgets.filter((b) => b.status === "WARNING");
  if (warning.length > 0) {
    const b = warning[0];
    return `Budget ${b.category?.name} sudah terpakai ${b.percentage}%. Sisa Rp${b.remaining.toLocaleString("id-ID")} untuk sisa bulan ini.`;
  }

  if (previousExpense > 0) {
    const delta = Math.round(((expense - previousExpense) / previousExpense) * 100);
    if (delta >= 15) {
      return `Pengeluaran bulan ini naik ${delta}% dibanding bulan lalu. Cek kategori terbesar untuk melihat penyebabnya.`;
    }
    if (delta <= -15) {
      return `Mantap, pengeluaran bulan ini turun ${Math.abs(delta)}% dibanding bulan lalu. Pertahankan polanya.`;
    }
  }

  if (income > 0 && expense / income > 0.8) {
    return `Pengeluaran sudah ${Math.round((expense / income) * 100)}% dari pemasukan. Sisakan minimal 20% untuk tabungan.`;
  }

  const top = expenseByCategory[0];
  if (top) {
    return `Pengeluaran terbesar bulan ini di kategori ${top.name} sebesar Rp${top.amount.toLocaleString("id-ID")}. Pastikan masih sesuai rencana.`;
  }

  return "Kondisi keuangan bulan ini terkendali. Terus catat transaksi supaya insight makin akurat.";
}

export async function getSummary(userId, month) {
  const range = parseMonth(month);
  const prev = previousMonth(range);

  const [incomeAgg, expenseAgg, prevIncomeAgg, prevExpenseAgg, expenseGroups, recent, budgetData, categories] =
    await Promise.all([
      transactionRepository.sumByType(userId, "INCOME", range.start, range.end),
      transactionRepository.sumByType(userId, "EXPENSE", range.start, range.end),
      transactionRepository.sumByType(userId, "INCOME", prev.start, prev.end),
      transactionRepository.sumByType(userId, "EXPENSE", prev.start, prev.end),
      transactionRepository.groupByCategory(userId, "EXPENSE", range.start, range.end),
      transactionRepository.recent(userId, 5),
      budgetService.list(userId, range.label),
      prisma.category.findMany({ where: { OR: [{ userId: null }, { userId }] } }),
    ]);

  const income = Number(incomeAgg._sum.amount || 0);
  const expense = Number(expenseAgg._sum.amount || 0);
  const previousIncome = Number(prevIncomeAgg._sum.amount || 0);
  const previousExpense = Number(prevExpenseAgg._sum.amount || 0);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const expenseByCategory = expenseGroups
    .map((row) => ({
      category_id: row.categoryId,
      name: categoryById.get(row.categoryId)?.name || "Lainnya",
      icon: categoryById.get(row.categoryId)?.icon || null,
      amount: Number(row._sum.amount || 0),
    }))
    .sort((a, b) => b.amount - a.amount);

  const { score, label, breakdown } = calculateScore({
    income,
    expense,
    previousIncome,
    budgets: budgetData.items,
  });

  // Simpan skor terakhir supaya bisa dipakai modul lain tanpa hitung ulang.
  await prisma.user.update({ where: { id: userId }, data: { financialScore: score } });

  return {
    month: range.label,
    total_balance: income - expense,
    monthly_income: income,
    monthly_expense: expense,
    previous_month: { income: previousIncome, expense: previousExpense },
    financial_score: score,
    financial_score_label: label,
    financial_score_breakdown: breakdown,
    expense_by_category: expenseByCategory,
    budget_summary: budgetData.summary,
    budget_alerts: budgetData.items.filter((b) => b.status !== "SAFE"),
    recent_transactions: recent.map(transactionDto),
    ai_insight: buildInsight({ income, expense, budgets: budgetData.items, expenseByCategory, previousExpense }),
  };
}

export async function getCashflow(userId, months = 6) {
  const safeMonths = Math.min(12, Math.max(1, Number(months) || 6));
  const current = parseMonth();
  const series = [];

  for (let offset = safeMonths - 1; offset >= 0; offset--) {
    const start = new Date(Date.UTC(current.year, current.monthIndex - offset, 1));
    const end = new Date(Date.UTC(current.year, current.monthIndex - offset + 1, 1));
    const [incomeAgg, expenseAgg] = await Promise.all([
      transactionRepository.sumByType(userId, "INCOME", start, end),
      transactionRepository.sumByType(userId, "EXPENSE", start, end),
    ]);
    series.push({
      month: start.toISOString().slice(0, 7),
      income: Number(incomeAgg._sum.amount || 0),
      expense: Number(expenseAgg._sum.amount || 0),
    });
  }

  return series;
}
