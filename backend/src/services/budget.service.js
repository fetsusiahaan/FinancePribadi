import { budgetRepository } from "../repositories/budget.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { transactionRepository } from "../repositories/transaction.repository.js";
import { parseMonth } from "../utils/period.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// PRD §4: AI memberi warning kalau budget hampir habis.
function statusOf(percentage) {
  if (percentage >= 100) return "EXCEEDED";
  if (percentage >= 80) return "WARNING";
  return "SAFE";
}

function toDto(budget, spent) {
  const limit = Number(budget.amountLimit);
  const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  return {
    id: budget.id,
    amount_limit: limit,
    month_year: budget.monthYear.toISOString().slice(0, 10),
    spent,
    remaining: limit - spent,
    percentage,
    status: statusOf(percentage),
    category: budget.category
      ? {
          id: budget.category.id,
          name: budget.category.name,
          type: budget.category.type,
          icon: budget.category.icon,
        }
      : null,
  };
}

async function assertExpenseCategory(categoryId, userId) {
  const category = await categoryRepository.findAccessible(categoryId, userId);
  if (!category) throw httpError("Category not found", 404);
  if (category.type !== "EXPENSE") throw httpError("Budget only applies to expense categories", 400);
  return category;
}

export async function list(userId, month) {
  const range = parseMonth(month);
  const budgets = await budgetRepository.listByMonth(userId, range.start);

  const spending = await transactionRepository.groupByCategory(userId, "EXPENSE", range.start, range.end);
  const spentByCategory = new Map(spending.map((row) => [row.categoryId, Number(row._sum.amount || 0)]));

  const items = budgets.map((budget) => toDto(budget, spentByCategory.get(budget.categoryId) || 0));
  const totalLimit = items.reduce((sum, b) => sum + b.amount_limit, 0);
  const totalSpent = items.reduce((sum, b) => sum + b.spent, 0);

  return {
    month: range.label,
    items,
    summary: {
      total_limit: totalLimit,
      total_spent: totalSpent,
      total_remaining: totalLimit - totalSpent,
      percentage: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
    },
  };
}

export async function create(userId, { category_id, amount_limit, month_year }) {
  await assertExpenseCategory(category_id, userId);
  const monthStart = new Date(`${month_year.slice(0, 7)}-01T00:00:00.000Z`);

  const duplicate = await budgetRepository.findByCategoryMonth(userId, category_id, monthStart);
  if (duplicate) throw httpError("Budget for this category and month already exists", 409);

  const budget = await budgetRepository.create({
    userId,
    categoryId: category_id,
    amountLimit: amount_limit,
    monthYear: monthStart,
  });
  return toDto(budget, 0);
}

export async function update(userId, id, { amount_limit }) {
  const existing = await budgetRepository.findOwned(id, userId);
  if (!existing) throw httpError("Budget not found", 404);

  const budget = await budgetRepository.update(id, { amountLimit: amount_limit });
  const range = { start: budget.monthYear, end: new Date(budget.monthYear.getTime()) };
  range.end.setUTCMonth(range.end.getUTCMonth() + 1);

  const spending = await transactionRepository.groupByCategory(userId, "EXPENSE", range.start, range.end);
  const spent = Number(spending.find((row) => row.categoryId === budget.categoryId)?._sum.amount || 0);
  return toDto(budget, spent);
}

export async function remove(userId, id) {
  const existing = await budgetRepository.findOwned(id, userId);
  if (!existing) throw httpError("Budget not found", 404);
  await budgetRepository.remove(id);
}
