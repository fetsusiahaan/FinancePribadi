import { cn } from "../../utils/cn";

// Tampilan tier akun. Nilainya datang apa adanya dari `tier` di GET /users/me --
// backend sudah menurunkan PREMIUM yang kedaluwarsa menjadi FREE, jadi di sini
// tidak ada perbandingan tanggal sama sekali. Menghitung ulang kedaluwarsa di
// klien berarti dua sumber kebenaran yang bisa berbeda.
const STYLES = {
  FREE: "bg-surface-container-high text-on-surface-variant dark:bg-dark-surface-container-high dark:text-dark-on-surface-variant",
  PREMIUM: "bg-primary/12 text-primary",
  LIFETIME: "bg-secondary/15 text-secondary",
};

const LABELS = { FREE: "Free", PREMIUM: "Premium", LIFETIME: "Lifetime" };

export function TierBadge({ tier, className }) {
  // Tier tak dikenal ditampilkan apa adanya, bukan disembunyikan: tier baru yang
  // ditambahkan di backend harus terlihat, meski belum punya warna.
  const label = LABELS[tier] ?? tier;
  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium shrink-0",
        STYLES[tier] ?? STYLES.FREE,
        className
      )}
    >
      {label}
    </span>
  );
}
