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

  // Keuangan Bersama. WAJIB terdaftar di sini: logActivity() diam-diam
  // return untuk action yang tidak dikenal (baris 17 di bawah), jadi kunci yang
  // lupa ditambahkan berarti kehilangan data tanpa satu pun error.
  //
  // Catatan: ini BUKAN jejak audit yang tahan lama — activity_logs di-hard
  // delete setelah ACTIVITY_LOG_RETENTION_DAYS. Riwayat keanggotaan dan alih
  // kepemilikan yang permanen ada di tabel shared_finance_members dan kolom
  // shared_finances.ownership_transferred_at.
  "shared_finance.created": { label: "Create Shared Finance", module: "Shared Finance" },
  "shared_finance.updated": { label: "Update Shared Finance", module: "Shared Finance" },
  "shared_finance.archived": { label: "Archive Shared Finance", module: "Shared Finance" },
  "shared_finance.unarchived": { label: "Unarchive Shared Finance", module: "Shared Finance" },
  "shared_finance.deleted": { label: "Delete Shared Finance", module: "Shared Finance" },
  "shared_finance.member_joined": { label: "Member Joined", module: "Shared Finance" },
  "shared_finance.member_removed": { label: "Member Removed", module: "Shared Finance" },
  "shared_finance.member_left": { label: "Member Left", module: "Shared Finance" },
  "shared_finance.ownership_transferred": { label: "Transfer Ownership", module: "Shared Finance" },
  "shared_finance.invitation_created": { label: "Create Invitation", module: "Shared Finance" },
  "shared_finance.invitation_revoked": { label: "Revoke Invitation", module: "Shared Finance" },
  "shared_transaction.created": { label: "Create Shared Transaction", module: "Shared Finance" },
  "shared_transaction.updated": { label: "Update Shared Transaction", module: "Shared Finance" },
  "shared_transaction.deleted": { label: "Delete Shared Transaction", module: "Shared Finance" },
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
