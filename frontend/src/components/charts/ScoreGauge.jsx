// Nilai light dipilih agar kontras teks label >=4.5:1 di atas permukaan terang;
// varian dark lebih terang supaya tetap terbaca di latar gelap.
const LABEL_COLOR = {
  Poor: { light: "#b91c1c", dark: "#f87171" },
  Fair: { light: "#a16207", dark: "#fbbf24" },
  Good: { light: "#047857", dark: "#34d399" },
  Excellent: { light: "#2563eb", dark: "#60a5fa" },
};

const LABEL_ID = {
  Poor: "Kurang",
  Fair: "Cukup",
  Good: "Baik",
  Excellent: "Sangat baik",
};

/** Financial Health Score 0-100 (PRD §12). */
export function ScoreGauge({ score, label, size = 120 }) {
  const thickness = 12;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const progress = (clamped / 100) * circumference;
  const tone = LABEL_COLOR[label] || LABEL_COLOR.Excellent;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size, "--gauge": tone.light, "--gauge-dark": tone.dark }}
      role="img"
      aria-label={`Skor kesehatan finansial ${clamped} dari 100, kategori ${LABEL_ID[label] || label}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-surface-variant dark:stroke-dark-surface-variant"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          className="stroke-[var(--gauge)] dark:stroke-[var(--gauge-dark)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="tnum text-2xl font-semibold text-on-background dark:text-dark-on-background">
          {clamped}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[var(--gauge)] dark:text-[var(--gauge-dark)]">
          {label}
        </span>
      </div>
    </div>
  );
}
