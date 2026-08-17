/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Skema ungu-lavender (gaya FundFlex) — dulunya biru #2563eb.
        // Ganti nilai token, bukan nama, supaya semua bg-primary/text-primary/
        // ring-primary dst di seluruh app ikut berubah dari satu sumber ini.
        primary: "#7c3aed",
        secondary: "#10b981",
        accent: "#a855f7",
        "on-background": "#1e1b2e",
        background: "#f5f3ff",
        "on-primary": "#ffffff",
        "primary-container": "#a78bfa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#ede9fe",
        "surface-container": "#e9e5fc",
        "surface-container-high": "#ddd6fe",
        "surface-variant": "#ddd6fe",
        "on-surface": "#1e1b2e",
        "on-surface-variant": "#4c4560",
        outline: "#7c7593",
        "outline-variant": "#cbc4e0",
        "dark-background": "#150f20",
        "dark-on-background": "#e5e0fa",
        "dark-surface-container-lowest": "#1e1830",
        "dark-surface-container-low": "#241d3a",
        "dark-surface-container": "#2c2447",
        "dark-surface-container-high": "#352c54",
        "dark-surface-variant": "#3a3160",
        "dark-on-surface-variant": "#cbc4e0",
        "dark-outline": "#948caa",
        "dark-outline-variant": "#4c4560",
        // Warna semantik status — dipakai budget, validasi form, dan tren transaksi.
        // Nilai light dipilih agar >=4.5:1 di atas permukaan terang, nilai dark
        // sengaja lebih terang/desaturasi (bukan warna yang sama) supaya tetap terbaca.
        success: "#047857",
        "success-container": "#d1fae5",
        "dark-success": "#34d399",
        warning: "#a16207",
        "warning-container": "#fef3c7",
        "dark-warning": "#fbbf24",
        danger: "#b91c1c",
        "danger-container": "#fee2e2",
        "dark-danger": "#f87171",
      },
      fontSize: {
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "label-sm": ["0.75rem", { lineHeight: "1rem" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        xxl: "64px",
        gutter: "24px",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
