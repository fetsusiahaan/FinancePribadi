import { getEffectiveTier } from "../services/plan.service.js";

// Gerbang tier untuk route berbayar.
//
// requireRole() yang sudah ada TIDAK bisa dipakai: ia membaca klaim `role` dari
// JWT. Tier berubah tanpa token ikut berubah -- orang yang baru saja membayar
// akan tetap ditolak sampai token lamanya kedaluwarsa. Karena itu tier dibaca
// dari DB tiap request, mengikuti pola requireMembership() di
// sharedFinanceMembership.middleware.js.
//
// Harganya satu query indexed per route terproteksi, dan hasilnya ditempel ke
// req.tier supaya service di belakangnya tidak perlu bertanya lagi.
export function requireTier(...tiers) {
  const allowed = new Set(tiers);
  return async (req, res, next) => {
    try {
      const tier = await getEffectiveTier(req.userId);
      if (!allowed.has(tier)) {
        // 403, bukan 404: resource-nya memang ada dan pemanggil berhak tahu
        // bahwa yang kurang adalah tiernya. `code` dan `required` dipakai client
        // untuk memunculkan ajakan upgrade, bukan pesan error umum.
        return res.status(403).json({
          status: "error",
          message: "Upgrade required",
          code: "TIER_REQUIRED",
          required: [...allowed],
          current: tier,
        });
      }
      req.tier = tier;
      next();
    } catch (err) {
      next(err);
    }
  };
}
