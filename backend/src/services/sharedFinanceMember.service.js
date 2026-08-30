import { sharedFinanceMemberRepository } from "../repositories/sharedFinanceMember.repository.js";
import { ROLES, MEMBER_STATUS } from "./sharedFinance.constants.js";
import { logActivity } from "./activityLog.service.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function toDto(member, currentUserId) {
  return {
    id: member.id,
    user: member.user
      ? {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          avatar: member.user.avatar || null,
        }
      : null,
    role: member.role,
    status: member.status,
    joined_at: member.joinedAt,
    left_at: member.leftAt,
    is_me: member.userId === currentUserId,
  };
}

export async function list(membership, { includeInactive } = {}) {
  const rows = await sharedFinanceMemberRepository.list(membership.sharedFinanceId, {
    includeInactive: Boolean(includeInactive),
  });
  return rows.map((row) => toDto(row, membership.userId));
}

export async function remove(membership, memberId, ip) {
  const target = await sharedFinanceMemberRepository.findById(memberId, membership.sharedFinanceId);
  if (!target) throw httpError("Member not found", 404);

  // PRD §7: owner tidak bisa dikeluarkan begitu saja. Kalau boleh, keuangan
  // bersamanya akan berakhir tanpa owner sama sekali dan tidak ada seorang pun
  // yang bisa mengelolanya lagi.
  if (target.role === ROLES.OWNER) {
    throw httpError("Alihkan kepemilikan dulu sebelum mengeluarkan owner", 409);
  }
  if (target.status !== MEMBER_STATUS.ACTIVE) {
    throw httpError("Anggota sudah tidak aktif", 409);
  }

  await sharedFinanceMemberRepository.close(target.id, MEMBER_STATUS.REMOVED);
  await logActivity({
    userId: membership.userId,
    action: "shared_finance.member_removed",
    ipAddress: ip,
    metadata: { shared_finance_id: membership.sharedFinanceId, removed_user_id: target.userId },
  });
}

export async function leave(membership, ip) {
  // Alasan sama dengan remove(): owner yang keluar meninggalkan ruang tanpa owner.
  if (membership.role === ROLES.OWNER) {
    throw httpError("Alihkan kepemilikan dulu sebelum keluar", 409);
  }

  await sharedFinanceMemberRepository.close(membership.id, MEMBER_STATUS.LEFT);
  await logActivity({
    userId: membership.userId,
    action: "shared_finance.member_left",
    ipAddress: ip,
    metadata: { shared_finance_id: membership.sharedFinanceId },
  });
}
