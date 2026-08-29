// Satu-satunya service yang mengimpor `prisma` langsung.
//
// Alasannya: batas transaksi adalah keputusan lapisan service, dan tidak ada
// cara lain menyerahkan klien `tx` yang sama ke beberapa pemanggilan repository.
// Repository di bawah menerima parameter `client` justru untuk itu.
import { prisma } from "../config/db.js";
import { sharedFinanceRepository } from "../repositories/sharedFinance.repository.js";
import { sharedFinanceMemberRepository } from "../repositories/sharedFinanceMember.repository.js";
import { sharedFinanceInvitationRepository } from "../repositories/sharedFinanceInvitation.repository.js";
import { ROLES, MEMBER_STATUS } from "./sharedFinance.constants.js";
import { logActivity } from "./activityLog.service.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function toDto(sharedFinance, { myRole, memberCount } = {}) {
  return {
    id: sharedFinance.id,
    name: sharedFinance.name,
    description: sharedFinance.description,
    currency: sharedFinance.currency,
    is_archived: sharedFinance.isArchived,
    archived_at: sharedFinance.archivedAt,
    ownership_transferred_at: sharedFinance.ownershipTransferredAt,
    created_at: sharedFinance.createdAt,
    member_count: memberCount ?? sharedFinance._count?.members ?? 0,
    my_role: myRole ?? sharedFinance.members?.[0]?.role ?? null,
  };
}

export async function list(userId, { archived }) {
  const rows = await sharedFinanceRepository.listForUser(userId, { archived });
  return rows.map((row) => toDto(row));
}

export async function getById(membership) {
  const sharedFinance = await sharedFinanceRepository.findById(membership.sharedFinanceId);
  if (!sharedFinance) throw httpError("Shared finance not found", 404);
  return toDto(sharedFinance, { myRole: membership.role });
}

export async function create(userId, { name, description, currency }, ip) {
  // Atomik: keuangan bersama TANPA owner tidak boleh pernah bisa tercapai,
  // bahkan kalau proses mati persis di antara dua insert ini.
  const created = await prisma.$transaction(async (tx) => {
    const sharedFinance = await sharedFinanceRepository.create(
      {
        name,
        description: description || null,
        currency: currency || "IDR",
        createdBy: userId,
      },
      tx
    );
    await sharedFinanceMemberRepository.create(
      {
        sharedFinanceId: sharedFinance.id,
        userId,
        role: ROLES.OWNER,
        status: MEMBER_STATUS.ACTIVE,
      },
      tx
    );
    return sharedFinance;
  });

  await logActivity({
    userId,
    action: "shared_finance.created",
    ipAddress: ip,
    metadata: { shared_finance_id: created.id, name: created.name },
  });

  return toDto(created, { myRole: ROLES.OWNER, memberCount: 1 });
}

export async function update(membership, payload, ip) {
  const data = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.description !== undefined) data.description = payload.description || null;
  if (payload.currency !== undefined) data.currency = payload.currency;

  const updated = await sharedFinanceRepository.update(membership.sharedFinanceId, data);
  await logActivity({
    userId: membership.userId,
    action: "shared_finance.updated",
    ipAddress: ip,
    metadata: { shared_finance_id: updated.id },
  });
  const memberCount = await sharedFinanceMemberRepository.countActive(updated.id);
  return toDto(updated, { myRole: membership.role, memberCount });
}

export async function setArchived(membership, archived, ip) {
  const updated = await sharedFinanceRepository.update(membership.sharedFinanceId, {
    isArchived: archived,
    archivedAt: archived ? new Date() : null,
  });

  // Mengarsipkan juga mencabut semua undangan yang masih hidup: kode yang masih
  // beredar tidak boleh bisa memasukkan orang ke ruang yang sudah ditutup.
  if (archived) await sharedFinanceInvitationRepository.revokeAllFor(updated.id);

  await logActivity({
    userId: membership.userId,
    action: archived ? "shared_finance.archived" : "shared_finance.unarchived",
    ipAddress: ip,
    metadata: { shared_finance_id: updated.id },
  });
  const memberCount = await sharedFinanceMemberRepository.countActive(updated.id);
  return toDto(updated, { myRole: membership.role, memberCount });
}

export async function remove(membership, { confirm_name }, ip) {
  // Hard delete + cascade: seluruh transaksi bersama milik SEMUA anggota ikut
  // hilang, bukan cuma milik owner. Karena itu namanya harus diketik ulang —
  // konfirmasi yang tidak bisa dilewati dengan sekali salah ketuk.
  const sharedFinance = await sharedFinanceRepository.findById(membership.sharedFinanceId);
  if (!sharedFinance) throw httpError("Shared finance not found", 404);
  if (confirm_name !== sharedFinance.name) {
    throw httpError("Nama konfirmasi tidak cocok", 400);
  }

  await sharedFinanceRepository.remove(sharedFinance.id);
  await logActivity({
    userId: membership.userId,
    action: "shared_finance.deleted",
    ipAddress: ip,
    metadata: { shared_finance_id: sharedFinance.id, name: sharedFinance.name },
  });
}

export async function transferOwnership(membership, { new_owner_user_id }, ip) {
  if (new_owner_user_id === membership.userId) {
    throw httpError("Tidak bisa mengalihkan kepemilikan ke diri sendiri", 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Dibaca ULANG di dalam transaksi. `membership` dimuat guard sebelum
    // transaksi ini dibuka, jadi bukan snapshot yang konsisten dengan tulisan di
    // bawah — di antara keduanya bisa saja kepemilikan sudah berpindah.
    const current = await sharedFinanceMemberRepository.findActiveTx(
      membership.sharedFinanceId,
      membership.userId,
      tx
    );
    if (!current || current.role !== ROLES.OWNER) throw httpError("Forbidden", 403);

    const target = await sharedFinanceMemberRepository.findActiveTx(
      membership.sharedFinanceId,
      new_owner_user_id,
      tx
    );
    if (!target) throw httpError("Target bukan anggota aktif", 404);

    // URUTANNYA WAJIB BEGINI. uq_shared_finance_single_active_owner menolak
    // owner aktif kedua tepat saat UPDATE-nya dieksekusi (Postgres memeriksa
    // unique index per statement, tidak ditunda sampai commit), jadi menaikkan
    // owner baru lebih dulu akan membatalkan seluruh transaksi.
    await sharedFinanceMemberRepository.setRole(current.id, ROLES.MEMBER, tx);
    await sharedFinanceMemberRepository.setRole(target.id, ROLES.OWNER, tx);

    // Catatan permanen. activity_logs di-hard delete setelah 5 hari, sedangkan
    // "siapa mengalihkan kepemilikan ke siapa" harus tetap bisa dilihat setelahnya.
    await sharedFinanceRepository.update(
      membership.sharedFinanceId,
      { ownershipTransferredAt: new Date(), previousOwnerUserId: current.userId },
      tx
    );

    return { from: current, to: target };
  });

  await logActivity({
    userId: membership.userId,
    action: "shared_finance.ownership_transferred",
    ipAddress: ip,
    metadata: {
      shared_finance_id: membership.sharedFinanceId,
      from_user_id: result.from.userId,
      to_user_id: result.to.userId,
    },
  });

  return { from_user_id: result.from.userId, to_user_id: result.to.userId };
}
