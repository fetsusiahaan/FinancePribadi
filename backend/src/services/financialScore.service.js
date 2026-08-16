/**
 * Financial Health Score 0-100 (PRD §12).
 * Parameter yang bisa dihitung dari data Sprint 2 (income, expense, budget):
 *   - Savings Rate      (35 poin)  seberapa besar sisa income yang tidak habis
 *   - Expense Control   (30 poin)  rasio pengeluaran terhadap pemasukan
 *   - Budget Discipline (20 poin)  kepatuhan terhadap batas budget yang dibuat
 *   - Income Stability  (15 poin)  konsistensi income dibanding bulan sebelumnya
 * Parameter Debt Ratio, Emergency Fund, dan Investment menyusul di Sprint 4
 * ketika modul Debt/Savings Goal/Investment sudah ada.
 */

const WEIGHTS = { savingsRate: 35, expenseControl: 30, budgetDiscipline: 20, incomeStability: 15 };

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function calculateScore({ income, expense, previousIncome, budgets }) {
  // Savings rate: 20% sudah dianggap sehat, jadi rasio 0.2 = poin penuh.
  const savingsRate = income > 0 ? (income - expense) / income : 0;
  const savingsRatio = clamp01(savingsRate / 0.2);

  // Expense control: habis <=70% income = penuh, habis >=100% = nol.
  const expenseRatio = income > 0 ? expense / income : 1;
  const expenseControlRatio = clamp01((1 - expenseRatio) / 0.3);

  // Budget discipline: proporsi budget yang tidak jebol. Tanpa budget = netral 50%.
  let budgetRatio = 0.5;
  if (budgets.length > 0) {
    const onTrack = budgets.filter((b) => b.spent <= b.amount_limit).length;
    budgetRatio = onTrack / budgets.length;
  }

  // Income stability: selisih income vs bulan lalu. Turun >=50% = nol.
  let stabilityRatio = 0.5;
  if (previousIncome > 0) {
    const delta = Math.abs(income - previousIncome) / previousIncome;
    stabilityRatio = clamp01(1 - delta / 0.5);
  } else if (income > 0) {
    stabilityRatio = 1;
  }

  const breakdown = {
    savings_rate: Math.round(savingsRatio * WEIGHTS.savingsRate),
    expense_control: Math.round(expenseControlRatio * WEIGHTS.expenseControl),
    budget_discipline: Math.round(budgetRatio * WEIGHTS.budgetDiscipline),
    income_stability: Math.round(stabilityRatio * WEIGHTS.incomeStability),
  };

  const score = Object.values(breakdown).reduce((sum, n) => sum + n, 0);

  let label = "Poor";
  if (score >= 80) label = "Excellent";
  else if (score >= 60) label = "Good";
  else if (score >= 40) label = "Fair";

  return { score, label, breakdown };
}
