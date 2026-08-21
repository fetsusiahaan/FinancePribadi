import { transactionRepository } from "../repositories/transaction.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { parseMonth } from "../utils/period.js";
import { logActivity } from "./activityLog.service.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function toDto(transaction) {
  return {
    id: transaction.id,
    amount: Number(transaction.amount),
    date: transaction.date.toISOString().slice(0, 10),
    description: transaction.description,
    receipt_url: transaction.receiptUrl,
    is_recurring: transaction.isRecurring,
    category: transaction.category
      ? {
          id: transaction.category.id,
          name: transaction.category.name,
          type: transaction.category.type,
          icon: transaction.category.icon,
        }
      : null,
  };
}

async function assertCategory(categoryId, userId) {
  const category = await categoryRepository.findAccessible(categoryId, userId);
  if (!category) throw httpError("Category not found", 404);
  return category;
}

export async function list(userId, { page = 1, limit = 20, type, categoryId, month }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const range = month ? parseMonth(month) : null;

  const [items, total] = await transactionRepository.list({
    userId,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    type,
    categoryId,
    start: range?.start,
    end: range?.end,
  });

  return {
    items: items.map(toDto),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      total_pages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

export async function create(userId, { amount, date, category_id, description, receipt_url, is_recurring }, ip) {
  await assertCategory(category_id, userId);
  const transaction = await transactionRepository.create({
    userId,
    categoryId: category_id,
    amount,
    date: new Date(`${date}T00:00:00.000Z`),
    description: description || null,
    receiptUrl: receipt_url || null,
    isRecurring: Boolean(is_recurring),
  });
  await logActivity({
    userId,
    action: "transaction.created",
    ipAddress: ip,
    metadata: { transaction_id: transaction.id, amount: Number(transaction.amount) },
  });
  return toDto(transaction);
}

export async function update(userId, id, payload, ip) {
  const existing = await transactionRepository.findOwned(id, userId);
  if (!existing) throw httpError("Transaction not found", 404);

  const data = {};
  if (payload.amount !== undefined) data.amount = payload.amount;
  if (payload.date !== undefined) data.date = new Date(`${payload.date}T00:00:00.000Z`);
  if (payload.description !== undefined) data.description = payload.description || null;
  if (payload.receipt_url !== undefined) data.receiptUrl = payload.receipt_url || null;
  if (payload.is_recurring !== undefined) data.isRecurring = Boolean(payload.is_recurring);
  if (payload.category_id !== undefined) {
    await assertCategory(payload.category_id, userId);
    data.categoryId = payload.category_id;
  }

  const transaction = await transactionRepository.update(id, data);
  await logActivity({
    userId,
    action: "transaction.updated",
    ipAddress: ip,
    metadata: { transaction_id: transaction.id, amount: Number(transaction.amount) },
  });
  return toDto(transaction);
}

export async function remove(userId, id, ip) {
  const existing = await transactionRepository.findOwned(id, userId);
  if (!existing) throw httpError("Transaction not found", 404);
  await transactionRepository.remove(id);
  await logActivity({
    userId,
    action: "transaction.deleted",
    ipAddress: ip,
    metadata: { transaction_id: id },
  });
}
