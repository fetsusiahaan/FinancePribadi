import { activityLogRepository } from "../repositories/activityLog.repository.js";
import { logBackend } from "../utils/logger.js";

export const ACTIONS = {
  "transaction.created": { label: "Create Transaction", module: "Finance" },
  "transaction.updated": { label: "Update Transaction", module: "Finance" },
  "transaction.deleted": { label: "Delete Transaction", module: "Finance" },
  "budget.created": { label: "Create Budget", module: "Finance" },
  "budget.updated": { label: "Update Budget", module: "Finance" },
  "budget.deleted": { label: "Delete Budget", module: "Finance" },
  "profile.updated": { label: "Update Profile", module: "Profile" },
  "auth.login": { label: "Login", module: "Authentication" },
};

export async function logActivity({ userId, action, ipAddress, metadata }) {
  const meta = ACTIONS[action];
  if (!meta) return;

  try {
    await activityLogRepository.create({
      userId,
      action,
      module: meta.module,
      metadata: metadata ?? undefined,
      ipAddress: ipAddress || null,
    });
  } catch (err) {
    logBackend(`Failed to record activity log "${action}" for user ${userId}: ${err.message}`, true);
  }
}

export async function listActivity({ page = 1, pageSize = 20, user, action, module, ip, date }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const filters = { userSearch: user, action, module, ip, date };

  const [rows, total] = await Promise.all([
    activityLogRepository.list(filters, { skip: (safePage - 1) * safePageSize, take: safePageSize }),
    activityLogRepository.count(filters),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      user: row.user,
      action: row.action,
      action_label: ACTIONS[row.action]?.label ?? row.action,
      module: row.module,
      ip_address: row.ipAddress,
      created_at: row.createdAt,
    })),
    page: safePage,
    page_size: safePageSize,
    total,
  };
}
