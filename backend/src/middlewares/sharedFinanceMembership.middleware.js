import { sharedFinanceMemberRepository } from "../repositories/sharedFinanceMember.repository.js";
import { can, MEMBER_STATUS } from "../services/sharedFinance.constants.js";

// Otorisasi per-resource untuk Keuangan Bersama (PRD_KB.md §11, §12).
//
// requireRole() yang sudah ada TIDAK bisa dipakai di sini: yang dibacanya klaim
// `role` di JWT, yaitu peran GLOBAL user di aplikasi (USER/ADMIN). Keanggotaan
// keuangan bersama melekat pada pasangan (user, keuangan bersama) dan berubah
// tanpa token ikut berubah — jadi harus datang dari database.
//
// Dibuat middleware, bukan assert di dalam service, karena: (1) sudah ada
// preseden otorisasi-sebagai-middleware di repo ini; (2) hasilnya ditempel ke
// req.membership sehingga cukup SATU query per request, bukan satu per fungsi
// service; (3) daftar route jadi terbaca sebagai matriks izin PRD §4 itu sendiri.
export function requireMembership(permission) {
  return async (req, res, next) => {
    try {
      const membership = await sharedFinanceMemberRepository.findActive(req.params.id, req.userId);

      // Bukan anggota → 404, BUKAN 403. Dua alasan: konvensi repo ini memang
      // memperlakukan "bukan milikmu" sama dengan "tidak ada" (lihat findOwned
      // di transaction.service.js), dan 403 akan memberi tahu orang asing bahwa
      // UUID yang ditebaknya benar-benar ada.
      if (!membership || membership.status !== MEMBER_STATUS.ACTIVE) {
        return res.status(404).json({ status: "error", message: "Shared finance not found" });
      }

      // Setelah keanggotaan terbukti, kekurangan hak MEMANG 403: resource-nya
      // sudah diketahui pemanggil, yang ditolak cuma aksinya.
      if (permission && !can(membership.role, permission)) {
        return res.status(403).json({ status: "error", message: "Forbidden" });
      }

      req.membership = membership;
      req.sharedFinance = membership.sharedFinance;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Keuangan bersama yang diarsipkan bersifat baca-saja. Dipasang hanya di route
// yang mengubah data; membaca tetap terbuka supaya riwayatnya masih bisa dilihat.
export function requireNotArchived(req, res, next) {
  if (req.sharedFinance?.isArchived) {
    return res.status(409).json({ status: "error", message: "Shared finance is archived" });
  }
  next();
}
