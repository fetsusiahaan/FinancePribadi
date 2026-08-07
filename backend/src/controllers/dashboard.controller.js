import { prisma } from "../config/db.js";

export async function getSummary(req, res, next) {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, category: { type: "INCOME" } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, category: { type: "EXPENSE" } },
        _sum: { amount: true },
      }),
    ]);

    const monthlyIncome = incomeAgg._sum.amount || 0;
    const monthlyExpense = expenseAgg._sum.amount || 0;

    res.json({
      status: "success",
      data: {
        total_balance: Number(monthlyIncome) - Number(monthlyExpense),
        monthly_income: Number(monthlyIncome),
        monthly_expense: Number(monthlyExpense),
        financial_score: user.financialScore,
        ai_insight: null,
      },
    });
  } catch (err) {
    next(err);
  }
}
