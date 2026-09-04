import { userPlanRepository } from "../repositories/userPlan.repository.js";
import { TIER, TIER_VALUES, PREMIUM_DURATION_DAYS } from "./plan.constants.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Tier yang BERLAKU, sebagai fungsi murni dari baris + waktu.
 *
 * Kedaluwarsa ditentukan saat dibaca, bukan dijadwalkan. Tidak ada cron yang
 * menurunkan tier: selama setiap pembacaan lewat sini, PREMIUM yang lewat
 * tanggal langsung terbaca FREE di detik yang sama, dan barisnya tetap utuh
 * sehingga perpanjangan cukup memperbarui expiresAt.
 *
 * Konsekuensinya satu aturan keras: kolom `tier` mentah dari DB TIDAK PERNAH
 * boleh dipakai langsung untuk mengambil keputusan.
 */
export function resolveTier(planRow, now = new Date()) {
  if (!planRow) return TIER.FREE;
  if (planRow.tier === TIER.FREE) return TIER.FREE;
  // LIFETIME mengabaikan expiresAt sepenuhnya, termasuk kalau kolomnya sempat
  // terisi -- "seumur hidup" yang bisa hangus bukan seumur hidup.
  if (planRow.tier === TIER.LIFETIME) return TIER.LIFETIME;
  if (planRow.expiresAt && planRow.expiresAt.getTime() <= now.getTime()) return TIER.FREE;
  return planRow.tier;
}

export function toPlanDto(planRow, now = new Date()) {
  const tier = resolveTier(planRow, now);
  return {
    tier,
    // Tanggal habis hanya bermakna kalau tier-nya masih berlaku. Setelah jatuh
    // ke FREE, mengirim tanggal masa lalu cuma bikin UI menghitung mundur angka
    // negatif.
    tier_expires_at: tier === TIER.PREMIUM ? planRow.expiresAt : null,
  };
}

export async function getEffectiveTier(userId) {
  return resolveTier(await userPlanRepository.findByUserId(userId));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Tanggal habis PREMIUM berikutnya: 30 hari, DITUMPUK di atas sisa yang belum
 * terpakai.
 *
 * Titik tolaknya bukan selalu "sekarang", melainkan mana yang lebih jauh antara
 * sekarang dan masa berlaku yang masih hidup. User dengan sisa 10 hari yang
 * memperpanjang mendapat 40 hari, bukan 30 -- hari yang sudah dibayar tidak
 * boleh hangus hanya karena ia membayar sebelum mepet.
 *
 * Yang sudah lewat tidak ikut ditumpuk: PREMIUM kedaluwarsa 3 bulan lalu
 * memulai lagi dari nol, bukan mundur ke belakang. Perbandingan `> now` yang
 * mengurusnya, dan LIFETIME tidak pernah sampai ke sini.
 */
export function premiumExpiryFrom(currentRow, now = new Date()) {
  const remaining =
    currentRow?.tier === TIER.PREMIUM && currentRow.expiresAt && currentRow.expiresAt.getTime() > now.getTime()
      ? currentRow.expiresAt
      : now;
  return new Date(remaining.getTime() + PREMIUM_DURATION_DAYS * DAY_MS);
}

export async function setTier(actorId, targetId, { tier, note = null }) {
  if (!TIER_VALUES.includes(tier)) throw httpError("Invalid tier", 400);

  // Tanggal habis TIDAK PERNAH datang dari pemanggil. PREMIUM selalu 30 hari
  // menurut PREMIUM_DURATION_DAYS; FREE dan LIFETIME tidak punya masa berlaku
  // sama sekali, dan menyimpan tanggal di sana akan jadi jebakan bagi pembaca
  // berikutnya.
  const expiresAt =
    tier === TIER.PREMIUM ? premiumExpiryFrom(await userPlanRepository.findByUserId(targetId)) : null;

  const [planRow] = await userPlanRepository.setTier(targetId, {
    tier,
    expiresAt,
    grantedById: actorId,
    note,
  });
  return toPlanDto(planRow);
}

export async function listGrants(userId) {
  const grants = await userPlanRepository.listGrants(userId);
  return grants.map((g) => ({
    id: g.id,
    tier: g.tier,
    starts_at: g.startsAt,
    expires_at: g.expiresAt,
    note: g.note,
    granted_by: g.grantedBy ? { id: g.grantedBy.id, name: g.grantedBy.name, email: g.grantedBy.email } : null,
    created_at: g.createdAt,
  }));
}

// Hitungan akun per tier untuk panel admin. Baris user_plans hanya ada untuk
// akun yang pernah di-grant, jadi FREE dihitung sebagai sisanya -- termasuk
// PREMIUM yang sudah kedaluwarsa, yang memang sudah FREE menurut resolveTier.
export async function summarizeTiers(totalUsers, now = new Date()) {
  const rows = await userPlanRepository.countByTier();
  const counts = { [TIER.FREE]: 0, [TIER.PREMIUM]: 0, [TIER.LIFETIME]: 0 };
  let granted = 0;
  for (const row of rows) {
    counts[row.tier] += row._count._all;
    granted += row._count._all;
  }

  // groupBy tidak bisa membedakan PREMIUM aktif dari yang sudah lewat, jadi
  // yang kedaluwarsa dipindah ke FREE lewat satu hitungan terpisah.
  const expiredPremium = await userPlanRepository.countExpiredPremium(now);
  counts[TIER.PREMIUM] -= expiredPremium;
  counts[TIER.FREE] = totalUsers - granted + counts[TIER.FREE] + expiredPremium;

  return {
    free: counts[TIER.FREE],
    premium: counts[TIER.PREMIUM],
    lifetime: counts[TIER.LIFETIME],
    paying: counts[TIER.PREMIUM] + counts[TIER.LIFETIME],
  };
}
