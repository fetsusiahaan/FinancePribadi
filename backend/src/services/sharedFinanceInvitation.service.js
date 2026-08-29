import crypto from "node:crypto";
import QRCode from "qrcode";
import { prisma } from "../config/db.js";
import { sharedFinanceInvitationRepository } from "../repositories/sharedFinanceInvitation.repository.js";
import { sharedFinanceMemberRepository } from "../repositories/sharedFinanceMember.repository.js";
import { ROLES, MEMBER_STATUS } from "./sharedFinance.constants.js";
import { logActivity } from "./activityLog.service.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Base32 gaya Crockford tanpa I, L, O, dan U. Hurufnya dibuang bukan karena
// selera: kode ini harus bisa DIKETIK ULANG saat kamera tidak tersedia, dan
// I/1, O/0, L/1 adalah pasangan yang paling sering salah baca. U dibuang supaya
// kombinasi acak tidak pernah membentuk kata yang tidak pantas.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 10;
const DEFAULT_EXPIRY_DAYS = 7;

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// URI bernamespace, bukan kode telanjang: pemindai QR umum jadi tahu ini bukan
// teks acak, dan deep link nanti tinggal didaftarkan tanpa mengganti kode yang
// sudah beredar. Sisi Android WAJIB tetap menerima kode telanjang juga (jalur
// ketik manual).
export const joinUrl = (code) => `finetra://shared-finance/join?code=${code}`;

export function toDto(invitation, { qrDataUri } = {}) {
  return {
    id: invitation.id,
    code: invitation.code,
    join_url: joinUrl(invitation.code),
    qr_data_uri: qrDataUri ?? null,
    expires_at: invitation.expiresAt,
    max_uses: invitation.maxUses,
    use_count: invitation.useCount,
    revoked_at: invitation.revokedAt,
    created_at: invitation.createdAt,
  };
}

async function generateUniqueCode() {
  // Tabrakan pada ruang 32^10 praktis tidak pernah terjadi, tapi unique
  // constraint-nya tetap ada, jadi lebih baik mencoba ulang daripada
  // melemparkan error internal ke user.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    const existing = await sharedFinanceInvitationRepository.findByCode(code);
    if (!existing) return code;
  }
  throw httpError("Gagal membuat kode undangan, coba lagi", 500);
}

async function buildQr(invitation) {
  try {
    return await QRCode.toDataURL(joinUrl(invitation.code));
  } catch {
    // QR-nya juga digambar sendiri di sisi Android dari `code`. Kalau
    // pembuatan data URI gagal, undangannya tetap berguna — jangan gagalkan
    // seluruh request cuma karena gambarnya.
    return null;
  }
}

async function issue(membership, { expires_in_days, max_uses }) {
  const code = await generateUniqueCode();
  const days = expires_in_days === undefined ? DEFAULT_EXPIRY_DAYS : Number(expires_in_days);
  const invitation = await sharedFinanceInvitationRepository.create({
    sharedFinanceId: membership.sharedFinanceId,
    code,
    createdBy: membership.userId,
    expiresAt: days > 0 ? new Date(Date.now() + days * 86400000) : null,
    maxUses: max_uses ? Number(max_uses) : null,
  });
  return invitation;
}

export async function getCurrent(membership) {
  let invitation = await sharedFinanceInvitationRepository.findCurrent(membership.sharedFinanceId);
  // Dibuat otomatis kalau belum ada: owner membuka layar "Undang Anggota" justru
  // untuk mendapatkan kode, jadi memaksanya menekan tombol dulu tidak ada gunanya.
  if (!invitation) invitation = await issue(membership, {});
  return toDto(invitation, { qrDataUri: await buildQr(invitation) });
}

export async function rotate(membership, payload, ip) {
  // Kode lama dicabut, bukan dihapus: hitungan pemakaiannya tetap jadi jejak.
  await sharedFinanceInvitationRepository.revokeAllFor(membership.sharedFinanceId);
  const invitation = await issue(membership, payload || {});
  await logActivity({
    userId: membership.userId,
    action: "shared_finance.invitation_created",
    ipAddress: ip,
    metadata: { shared_finance_id: membership.sharedFinanceId, invitation_id: invitation.id },
  });
  return toDto(invitation, { qrDataUri: await buildQr(invitation) });
}

export async function revoke(membership, invitationId, ip) {
  const invitation = await sharedFinanceInvitationRepository.findById(
    invitationId,
    membership.sharedFinanceId
  );
  if (!invitation) throw httpError("Invitation not found", 404);
  await sharedFinanceInvitationRepository.revoke(invitation.id);
  await logActivity({
    userId: membership.userId,
    action: "shared_finance.invitation_revoked",
    ipAddress: ip,
    metadata: { shared_finance_id: membership.sharedFinanceId, invitation_id: invitation.id },
  });
}

// Alasan penolakan sengaja dibedakan supaya UI bisa memberi tahu user apa yang
// salah. Ini TIDAK membocorkan apa pun: pemanggilnya sudah memegang kodenya.
function rejectionReason(invitation) {
  if (!invitation) return "NOT_FOUND";
  if (invitation.revokedAt) return "REVOKED";
  if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) return "EXPIRED";
  if (invitation.maxUses !== null && invitation.useCount >= invitation.maxUses) return "MAX_USES";
  if (invitation.sharedFinance?.isArchived) return "ARCHIVED";
  return null;
}

export async function validate(code) {
  const invitation = await sharedFinanceInvitationRepository.findByCode(code);
  const reason = rejectionReason(invitation);
  return reason ? { valid: false, reason } : { valid: true };
}

export async function preview(code, userId) {
  const invitation = await sharedFinanceInvitationRepository.findByCode(code);
  const reason = rejectionReason(invitation);
  if (reason) throw httpError("Kode tidak valid atau sudah kedaluwarsa", 400);

  const sharedFinance = invitation.sharedFinance;
  const [memberCount, owner, existing] = await Promise.all([
    sharedFinanceMemberRepository.countActive(sharedFinance.id),
    sharedFinanceMemberRepository.findOwner(sharedFinance.id),
    sharedFinanceMemberRepository.findAnyTx(sharedFinance.id, userId),
  ]);

  // SENGAJA MINIMAL. Kode undangan adalah kredensial bearer: siapa pun yang
  // memegangnya bisa memanggil ini. Jadi tidak ada nominal, tidak ada daftar
  // anggota, tidak ada transaksi — cukup untuk memutuskan "ini ruang yang benar
  // atau bukan" sebelum bergabung.
  return {
    id: sharedFinance.id,
    name: sharedFinance.name,
    description: sharedFinance.description,
    currency: sharedFinance.currency,
    member_count: memberCount,
    owner_name: owner?.user?.name ?? null,
    already_member: existing?.status === MEMBER_STATUS.ACTIVE,
  };
}

export async function join(userId, code, ip) {
  const result = await prisma.$transaction(async (tx) => {
    // Dibaca ulang DI DALAM transaksi lalu divalidasi lagi. Pemeriksaan di
    // validate()/preview() terjadi di request terpisah; tanpa pengecekan ulang
    // di sini, kode yang dicabut atau sudah habis kuotanya tepat sesudahnya
    // masih bisa dipakai masuk.
    const invitation = await sharedFinanceInvitationRepository.findByCode(code, tx);
    const reason = rejectionReason(invitation);
    if (reason === "ARCHIVED") throw httpError("Keuangan bersama ini sudah diarsipkan", 409);
    if (reason) throw httpError("Kode tidak valid atau sudah kedaluwarsa", 400);

    const sharedFinanceId = invitation.sharedFinanceId;
    const existing = await sharedFinanceMemberRepository.findAnyTx(sharedFinanceId, userId, tx);

    if (existing?.status === MEMBER_STATUS.ACTIVE) {
      throw httpError("Kamu sudah jadi anggota", 409);
    }

    if (existing) {
      // Baris lamanya (LEFT/REMOVED) DIPERBARUI, bukan dibuat baru: insert akan
      // menabrak uq_shared_finance_member yang unik per (keuangan bersama, user).
      await sharedFinanceMemberRepository.update(
        existing.id,
        {
          role: ROLES.MEMBER,
          status: MEMBER_STATUS.ACTIVE,
          joinedAt: new Date(),
          leftAt: null,
        },
        tx
      );
    } else {
      await sharedFinanceMemberRepository.create(
        {
          sharedFinanceId,
          userId,
          role: ROLES.MEMBER,
          status: MEMBER_STATUS.ACTIVE,
        },
        tx
      );
    }

    await sharedFinanceInvitationRepository.incrementUse(invitation.id, tx);
    return invitation.sharedFinance;
  });

  await logActivity({
    userId,
    action: "shared_finance.member_joined",
    ipAddress: ip,
    metadata: { shared_finance_id: result.id },
  });

  return { id: result.id, name: result.name };
}
