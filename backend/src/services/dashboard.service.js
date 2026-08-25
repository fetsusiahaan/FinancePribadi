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

const DAY_MS = 86400000;
const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const isoDay = (d) => d.toISOString().slice(0, 10);
const utcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/**
 * Awal minggu versi Indonesia: SENIN, bukan Minggu seperti getUTCDay() bawaan.
 * Seluruh kartu arus kas memakai batas Sen..Min, jadi konversinya dipusatkan
 * di sini supaya tidak ada dua definisi "minggu" yang saling geser satu hari.
 */
function startOfWeek(d) {
  const base = utcDay(d);
  const mondayOffset = (base.getUTCDay() + 6) % 7; // Min(0) -> 6, Sen(1) -> 0
  return new Date(base.getTime() - mondayOffset * DAY_MS);
}

/**
 * Arus kas untuk kartu "Aktivitas Arus Kas" di dashboard mobile.
 *
 * Rentangnya kalender, BUKAN "N hari terakhir" yang bergulir. Sebelumnya
 * "Minggu Ini" berarti 7 hari ke belakang dari hari ini, jadi sumbunya berputar
 * tiap hari dan tidak pernah sejajar dengan minggu yang dipakai orang saat
 * bicara "minggu ini". Sekarang:
 *
 *   this_week  -> Senin..Minggu minggu berjalan; hari yang belum lewat = 0
 *   last_week  -> Senin..Minggu minggu sebelumnya
 *   this_month -> tanggal 1 s/d hari ini, dikelompokkan per minggu kalender
 *                 (Minggu 1..5) karena ~30 titik harian tidak terbaca di layar
 *                 selebar 360dp
 *
 * granularity ikut dikirim supaya klien tidak perlu menebak bentuk sumbu dari
 * jumlah titik. Satu query untuk seluruh rentang lalu dikelompokkan di memori,
 * bukan N+1 query per bucket seperti getCashflow.
 */
export async function getRangeCashflow(userId, range = "this_week") {
  const now = new Date();
  const today = utcDay(now);
  const safeRange = ["this_week", "last_week", "this_month"].includes(range) ? range : "this_week";

  let start;
  let endExclusive;
  if (safeRange === "this_month") {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    endExclusive = new Date(today.getTime() + DAY_MS);
  } else {
    start = startOfWeek(today);
    if (safeRange === "last_week") start = new Date(start.getTime() - 7 * DAY_MS);
    // Minggu penuh: hari yang belum lewat tetap ditarik sebagai bucket nol
    // supaya sumbunya selalu Sen..Min, tidak memendek di tengah minggu.
    endExclusive = new Date(start.getTime() + 7 * DAY_MS);
  }

  const rows = await transactionRepository.listBetween(userId, start, endExclusive);

  // Ringkas ke harian dulu, apa pun granularity akhirnya: pengelompokan
  // mingguan tinggal menjumlahkan hasil ini, tidak perlu jalur kedua.
  const daily = new Map();
  for (let t = start.getTime(); t < endExclusive.getTime(); t += DAY_MS) {
    daily.set(isoDay(new Date(t)), { income: 0, expense: 0 });
  }
  for (const row of rows) {
    const bucket = daily.get(isoDay(new Date(row.date)));
    if (!bucket) continue;
    if (row.category?.type === "INCOME") bucket.income += Number(row.amount);
    else bucket.expense += Number(row.amount);
  }

  if (safeRange !== "this_month") {
    const points = [...daily.entries()].map(([date, v], i) => ({
      key: date,
      date,
      label: DAY_LABELS[i],
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
    }));
    return { granularity: "day", start: isoDay(start), end: isoDay(new Date(endExclusive.getTime() - DAY_MS)), points };
  }

  // Minggu 1 = tanggal 1 s/d Minggu pertama, jadi panjangnya bisa < 7 hari
  // kalau tanggal 1 bukan Senin. Batasnya sengaja tetap Senin supaya nomor
  // minggu di sini sama dengan minggu yang dilihat user di opsi "Minggu Ini".
  const firstWeekStart = startOfWeek(start);
  const weeks = new Map();
  for (const [date, v] of daily) {
    const index = Math.floor((startOfWeek(new Date(`${date}T00:00:00Z`)).getTime() - firstWeekStart.getTime()) / (7 * DAY_MS));
    const bucket = weeks.get(index) || { income: 0, expense: 0, from: date, to: date };
    bucket.income += v.income;
    bucket.expense += v.expense;
    bucket.to = date;
    weeks.set(index, bucket);
  }

  const points = [...weeks.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, v]) => ({
      key: `w${index + 1}`,
      label: `Minggu ${index + 1}`,
      from: v.from,
      to: v.to,
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
    }));

  return { granularity: "week", start: isoDay(start), end: isoDay(today), points };
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
