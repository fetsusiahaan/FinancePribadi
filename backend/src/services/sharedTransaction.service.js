import { sharedTransactionRepository } from "../repositories/sharedTransaction.repository.js";
import { sharedFinanceMemberRepository } from "../repositories/sharedFinanceMember.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { parseMonth } from "../utils/period.js";
import { can, P } from "./sharedFinance.constants.js";
import { logActivity } from "./activityLog.service.js";
import { sendToUsers } from "./pushNotification.service.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function toDto(tx, membership) {
  const isOwn = tx.createdByUserId === membership.userId;
  return {
    id: tx.id,
    amount: Number(tx.amount),
    date: tx.date.toISOString().slice(0, 10),
    description: tx.description,
    type: tx.type,
    category: tx.category
      ? { id: tx.category.id, name: tx.category.name, type: tx.category.type, icon: tx.category.icon }
      : null,
    created_by: tx.createdBy ? { id: tx.createdBy.id, name: tx.createdBy.name } : null,
    created_at: tx.createdAt,
    // Dihitung di server supaya Android tidak perlu menyalin ulang matriks izin
    // PRD §4 — cukup menyembunyikan tombolnya. Ini MURNI UX: setiap mutasi tetap
    // diperiksa ulang di bawah, jadi klien yang mengabaikan flag ini tetap ditolak.
    can_edit: isOwn || can(membership.role, P.EDIT_ANY_TRANSACTION),
    can_delete: isOwn || can(membership.role, P.DELETE_ANY_TRANSACTION),
  };
}

// Kategori transaksi bersama HANYA boleh yang global. Lihat komentar
// findGlobal() di category.repository.js.
async function assertGlobalCategory(categoryId, type) {
  if (!categoryId) return null;
  const category = await categoryRepository.findGlobal(categoryId);
  if (!category) throw httpError("Category not found", 404);
  if (type && category.type !== type) {
    throw httpError("Kategori tidak cocok dengan tipe transaksi", 400);
  }
  return category;
}

export async function listCategories(type) {
  const rows = await categoryRepository.listGlobal(type);
  return rows.map((c) => ({ id: c.id, name: c.name, type: c.type, icon: c.icon }));
}

export async function list(membership, { page = 1, limit = 20, type, month }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const range = month ? parseMonth(month) : null;

  const [items, total] = await sharedTransactionRepository.list({
    sharedFinanceId: membership.sharedFinanceId,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    type,
    start: range?.start,
    end: range?.end,
  });

  return {
    items: items.map((tx) => toDto(tx, membership)),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      total_pages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

function dispatchSharedTxPush(membership, tx, { edited }) {
  Promise.resolve().then(async () => {
    try {
      const members = await sharedFinanceMemberRepository.list(membership.sharedFinanceId);
      const recipientIds = members
        .map((m) => m.userId)
        .filter((id) => id !== membership.userId);

      if (recipientIds.length === 0) return;

      await sendToUsers(recipientIds, {
        type: "shared_transaction",
        shared_finance_id: membership.sharedFinanceId,
        shared_transaction_id: tx.id,
        shared_finance_name: membership.sharedFinance?.name ?? "",
        creator_name: tx.createdBy?.name ?? "",
        amount: Number(tx.amount),
        tx_type: tx.type,
        category_name: tx.category?.name ?? "",
        description: tx.description ?? "",
        edited,
      });
    } catch {
      // Diam - push gagal tidak boleh ganggu flow utama
    }
  });
}

export async function create(membership, { amount, date, type, category_id, description }, ip) {
  await assertGlobalCategory(category_id, type);

  const tx = await sharedTransactionRepository.create({
    sharedFinanceId: membership.sharedFinanceId,
    createdByUserId: membership.userId,
    categoryId: category_id || null,
    type,
    amount,
    date: new Date(`${date}T00:00:00.000Z`),
    description: description || null,
  });

  await logActivity({
    userId: membership.userId,
    action: "shared_transaction.created",
    ipAddress: ip,
    metadata: {
      shared_finance_id: membership.sharedFinanceId,
      shared_transaction_id: tx.id,
      amount: Number(tx.amount),
    },
  });

  dispatchSharedTxPush(membership, tx, { edited: false });

  return toDto(tx, membership);
}

// EDIT_OWN vs EDIT_ANY bergantung pada BARIS-nya, bukan pada route, jadi
// pemeriksaannya tidak bisa dilakukan middleware. Route cuma memastikan
// pemanggil boleh mengubah miliknya sendiri; kepemilikan barisnya diperiksa di
// sini.
function assertRowPermission(tx, membership, anyPermission) {
  const isOwn = tx.createdByUserId === membership.userId;
  if (!isOwn && !can(membership.role, anyPermission)) throw httpError("Forbidden", 403);
}

export async function update(membership, txId, payload, ip) {
  const existing = await sharedTransactionRepository.findInFinance(txId, membership.sharedFinanceId);
  if (!existing) throw httpError("Transaction not found", 404);
  assertRowPermission(existing, membership, P.EDIT_ANY_TRANSACTION);

  const data = {};
  if (payload.amount !== undefined) data.amount = payload.amount;
  if (payload.date !== undefined) data.date = new Date(`${payload.date}T00:00:00.000Z`);
  if (payload.description !== undefined) data.description = payload.description || null;
  if (payload.type !== undefined) data.type = payload.type;

  if (payload.category_id !== undefined) {
    // Tipe yang dipakai untuk validasi adalah tipe SETELAH perubahan, supaya
    // mengganti kategori dan tipe sekaligus tidak lolos dengan pasangan yang
    // tidak cocok.
    await assertGlobalCategory(payload.category_id, data.type ?? existing.type);
    data.categoryId = payload.category_id || null;
  } else if (data.type && existing.categoryId) {
    await assertGlobalCategory(existing.categoryId, data.type);
  }

  const tx = await sharedTransactionRepository.update(txId, data);
  await logActivity({
    userId: membership.userId,
    action: "shared_transaction.updated",
    ipAddress: ip,
    metadata: { shared_finance_id: membership.sharedFinanceId, shared_transaction_id: tx.id },
  });

  dispatchSharedTxPush(membership, tx, { edited: true });

  return toDto(tx, membership);
}

export async function remove(membership, txId, ip) {
  const existing = await sharedTransactionRepository.findInFinance(txId, membership.sharedFinanceId);
  if (!existing) throw httpError("Transaction not found", 404);
  assertRowPermission(existing, membership, P.DELETE_ANY_TRANSACTION);

  await sharedTransactionRepository.softDelete(txId);
  await logActivity({
    userId: membership.userId,
    action: "shared_transaction.deleted",
    ipAddress: ip,
    metadata: { shared_finance_id: membership.sharedFinanceId, shared_transaction_id: txId },
  });
}

export async function summary(membership, { month }) {
  const range = parseMonth(month);
  const [byType, byMember, members] = await Promise.all([
    sharedTransactionRepository.sumByType(membership.sharedFinanceId, range.start, range.end),
    sharedTransactionRepository.sumByMember(membership.sharedFinanceId, range.start, range.end),
    sharedFinanceMemberRepository.list(membership.sharedFinanceId, { includeInactive: true }),
  ]);

  const pick = (type) => Number(byType.find((r) => r.type === type)?._sum.amount ?? 0);
  const income = pick("INCOME");
  const expense = pick("EXPENSE");

  // Anggota yang sudah keluar tetap muncul kalau masih punya transaksi di bulan
  // itu — angkanya sudah masuk total, jadi menyembunyikan barisnya membuat
  // rincian tidak pernah menjumlah kembali ke totalnya.
  const nameOf = new Map(members.map((m) => [m.userId, m.user?.name ?? null]));
  const perMember = new Map();
  for (const row of byMember) {
    const entry = perMember.get(row.createdByUserId) ?? {
      user_id: row.createdByUserId,
      name: nameOf.get(row.createdByUserId) ?? null,
      income: 0,
      expense: 0,
    };
    if (row.type === "INCOME") entry.income = Number(row._sum.amount ?? 0);
    else entry.expense = Number(row._sum.amount ?? 0);
    perMember.set(row.createdByUserId, entry);
  }

  return {
    month: range.label,
    income,
    expense,
    balance: income - expense,
    members: [...perMember.values()].sort((a, b) => b.expense - a.expense),
  };
}
