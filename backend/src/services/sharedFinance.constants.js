// Model role Keuangan Bersama — lihat PRD_KB.md §1-§4.
//
// HANYA ada dua role: OWNER dan MEMBER. Tidak ada ADMIN, tidak ada VIEWER.
// `UserRole.ADMIN` yang dipakai panel /admin adalah konsep yang BERBEDA (peran
// global di seluruh aplikasi, bukan keanggotaan per keuangan bersama) dan tidak
// ada hubungannya dengan berkas ini.

export const ROLES = { OWNER: "OWNER", MEMBER: "MEMBER" };

export const MEMBER_STATUS = { ACTIVE: "ACTIVE", LEFT: "LEFT", REMOVED: "REMOVED" };

export const P = {
  VIEW: "VIEW",
  CREATE_TRANSACTION: "CREATE_TRANSACTION",
  EDIT_OWN_TRANSACTION: "EDIT_OWN_TRANSACTION",
  EDIT_ANY_TRANSACTION: "EDIT_ANY_TRANSACTION",
  DELETE_OWN_TRANSACTION: "DELETE_OWN_TRANSACTION",
  DELETE_ANY_TRANSACTION: "DELETE_ANY_TRANSACTION",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
  MANAGE_SETTINGS: "MANAGE_SETTINGS",
  VIEW_REPORT: "VIEW_REPORT",
  EXPORT_REPORT: "EXPORT_REPORT",
  ARCHIVE_SHARED_FINANCE: "ARCHIVE_SHARED_FINANCE",
  DELETE_SHARED_FINANCE: "DELETE_SHARED_FINANCE",
  TRANSFER_OWNERSHIP: "TRANSFER_OWNERSHIP",
};

// Matriks PRD_KB.md §4. Daftar MEMBER adalah ALLOWLIST: apa pun yang tidak
// tercantum di situ otomatis ditolak (PRD §12), jadi menambah permission baru
// ke `P` tidak pernah bisa diam-diam memberi akses ke MEMBER.
//
// MANAGE_ACCOUNTS dari PRD §2 sengaja tidak ada: entitas "accounts" belum ada
// di aplikasi ini. Tambahkan kalau fiturnya nanti dibuat.
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: new Set(Object.values(P)),
  [ROLES.MEMBER]: new Set([
    P.VIEW,
    P.CREATE_TRANSACTION,
    P.EDIT_OWN_TRANSACTION,
    P.DELETE_OWN_TRANSACTION,
    P.VIEW_REPORT,
  ]),
};

export const can = (role, permission) => Boolean(ROLE_PERMISSIONS[role]?.has(permission));
