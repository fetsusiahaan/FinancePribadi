// Self-check resolveTier/toPlanDto. Jalankan: node src/tests/plan.test.js
// Tanpa framework dan tanpa DB -- yang diuji fungsi murni, dan justru di situlah
// seluruh aturan kedaluwarsa tinggal.
import assert from "node:assert/strict";
import { resolveTier, toPlanDto, premiumExpiryFrom } from "../services/plan.service.js";
import { TIER, PREMIUM_DURATION_DAYS } from "../services/plan.constants.js";

const now = new Date("2026-06-15T00:00:00Z");
const future = new Date("2026-07-15T00:00:00Z");
const past = new Date("2026-05-15T00:00:00Z");

// Tidak punya baris = FREE, bukan error dan bukan null.
assert.equal(resolveTier(null, now), TIER.FREE);
assert.equal(resolveTier(undefined, now), TIER.FREE);

assert.equal(resolveTier({ tier: TIER.FREE, expiresAt: null }, now), TIER.FREE);
assert.equal(resolveTier({ tier: TIER.PREMIUM, expiresAt: future }, now), TIER.PREMIUM);

// Inti aturannya: PREMIUM lewat tanggal terbaca FREE tanpa ada job yang jalan.
assert.equal(resolveTier({ tier: TIER.PREMIUM, expiresAt: past }, now), TIER.FREE);
// Batas persis: habis pada detik ini berarti sudah habis.
assert.equal(resolveTier({ tier: TIER.PREMIUM, expiresAt: now }, now), TIER.FREE);

// LIFETIME tidak bisa hangus, bahkan kalau kolomnya sempat terisi.
assert.equal(resolveTier({ tier: TIER.LIFETIME, expiresAt: null }, now), TIER.LIFETIME);
assert.equal(resolveTier({ tier: TIER.LIFETIME, expiresAt: past }, now), TIER.LIFETIME);

// DTO: tanggal habis hanya dikirim selama tier-nya masih berlaku.
assert.deepEqual(toPlanDto(null, now), { tier: TIER.FREE, tier_expires_at: null });
assert.deepEqual(toPlanDto({ tier: TIER.PREMIUM, expiresAt: future }, now), {
  tier: TIER.PREMIUM,
  tier_expires_at: future,
});
assert.deepEqual(toPlanDto({ tier: TIER.PREMIUM, expiresAt: past }, now), {
  tier: TIER.FREE,
  tier_expires_at: null,
});
assert.deepEqual(toPlanDto({ tier: TIER.LIFETIME, expiresAt: null }, now), {
  tier: TIER.LIFETIME,
  tier_expires_at: null,
});

// --- premiumExpiryFrom: 30 hari, sisa ditumpuk ---

const DAY = 24 * 60 * 60 * 1000;
const days = (from, to) => Math.round((to.getTime() - from.getTime()) / DAY);

// Belum pernah punya PREMIUM: tepat 30 hari dari sekarang.
assert.equal(days(now, premiumExpiryFrom(null, now)), PREMIUM_DURATION_DAYS);
assert.equal(days(now, premiumExpiryFrom({ tier: TIER.FREE, expiresAt: null }, now)), PREMIUM_DURATION_DAYS);

// Sisa 10 hari lalu diperpanjang: 40 hari, bukan 30. Hari yang sudah dibayar
// tidak hangus hanya karena user memperpanjang lebih awal.
const sisa10 = new Date(now.getTime() + 10 * DAY);
assert.equal(days(now, premiumExpiryFrom({ tier: TIER.PREMIUM, expiresAt: sisa10 }, now)), 40);

// PREMIUM yang sudah lewat memulai lagi dari nol, tidak mundur ke belakang.
assert.equal(days(now, premiumExpiryFrom({ tier: TIER.PREMIUM, expiresAt: past }, now)), PREMIUM_DURATION_DAYS);

// LIFETIME yang diturunkan ke PREMIUM tidak ikut menumpuk expiresAt-nya.
assert.equal(
  days(now, premiumExpiryFrom({ tier: TIER.LIFETIME, expiresAt: future }, now)),
  PREMIUM_DURATION_DAYS
);

console.log("plan.test.js OK");
