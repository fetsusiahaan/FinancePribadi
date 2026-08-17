import { Button } from "./Button";

// Konten per skenario — offline terdeteksi lewat navigator.onLine, gagal
// permintaan dianggap error server/API (bukan network-level).
const VARIANTS = {
  offline: {
    icon: "wifi_off",
    title: "Tidak ada koneksi internet",
    description: "Periksa koneksi Wi-Fi atau data seluler kamu, lalu coba lagi.",
  },
  server: {
    icon: "cloud_off",
    title: "Server sedang bermasalah",
    description: "Ada gangguan di sisi kami. Coba lagi dalam beberapa saat.",
  },
  generic: {
    icon: "error",
    title: "Gagal memuat data",
    description: "Terjadi kesalahan yang tidak terduga. Coba lagi, atau muat ulang halaman.",
  },
};

/**
 * Pengganti pesan error teks polos — ikon + judul + deskripsi spesifik per
 * penyebab, dan tombol "Coba lagi" yang memanggil refetch() dari TanStack
 * Query secara langsung, bukan minta user reload seluruh halaman.
 */
export function ErrorState({ variant, onRetry, retrying, className = "" }) {
  const resolved = variant || (typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "server");
  const content = VARIANTS[resolved] || VARIANTS.generic;

  return (
    <div
      role="alert"
      className={`flex flex-col items-center text-center gap-xs py-lg px-md rounded-xl border border-danger/20 bg-danger/5 dark:bg-dark-danger/10 ${className}`}
    >
      <span
        className="w-11 h-11 rounded-full bg-danger/10 text-danger dark:text-dark-danger flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="material-symbols-outlined text-[22px]">{content.icon}</span>
      </span>
      <p className="font-medium text-on-background dark:text-dark-on-background">{content.title}</p>
      <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant max-w-sm">
        {content.description}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} disabled={retrying} className="mt-xs">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            refresh
          </span>
          {retrying ? "Mencoba lagi..." : "Coba lagi"}
        </Button>
      )}
    </div>
  );
}
