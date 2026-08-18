import { Link, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { getMe } from "../services/user.service";

// Sidebar desktop: tetap 3 item — desktop sudah punya ProfileChip terpisah
// di topbar, jadi menambah "Profil" di sini akan jadi duplikat.
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/transactions", label: "Transaksi", icon: "receipt_long" },
  { to: "/budgets", label: "Budget", icon: "savings" },
];

// Bottom nav mobile: 5 slot gaya FundFlex — Profil pindah ke sini (dicabut
// dari header), slot tengah kosong diisi tombol tambah transaksi mengambang.
const MOBILE_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/transactions", label: "Transaksi", icon: "receipt_long" },
  null,
  { to: "/budgets", label: "Budget", icon: "savings" },
  { to: "/profile", label: "Profil", icon: "person" },
];

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

// Chip identitas di topbar desktop: avatar + nama + email dalam satu kotak.
// Khusus desktop — di mobile Profil pindah ke slot bottom nav, jadi chip ini
// disembunyikan lewat hidden md:flex supaya tidak duplikat dgn nav bawah.
function ProfileChip() {
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMe });

  return (
    <NavLink
      to="/profile"
      aria-label={user ? `Profil: ${user.name}` : "Profil"}
      className={({ isActive }) =>
        `hidden md:flex items-center gap-xs min-h-11 pl-xs pr-sm max-w-[200px] rounded-full border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isActive
            ? "bg-primary/10 border-primary/30"
            : "border-outline-variant/50 dark:border-dark-outline-variant/50 hover:bg-surface-container dark:hover:bg-dark-surface-container"
        }`
      }
    >
      <span
        aria-hidden="true"
        className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-semibold shrink-0"
      >
        {user ? initials(user.name) : <span className="material-symbols-outlined text-[18px]">person</span>}
      </span>
      {user && (
        <span className="min-w-0 text-left">
          <span className="block text-body-sm font-medium leading-tight truncate">{user.name}</span>
          <span className="block text-[11px] leading-tight text-on-surface-variant dark:text-dark-on-surface-variant truncate">
            {user.email}
          </span>
        </span>
      )}
    </NavLink>
  );
}

// Ikon lonceng di header mobile — mengarah ke seksi Notifikasi di Profile
// (anchor native #notifikasi, tanpa JS scroll tambahan).
function NotificationBell() {
  return (
    <NavLink
      to="/profile#notifikasi"
      aria-label="Notifikasi"
      className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        notifications
      </span>
    </NavLink>
  );
}

export function DashboardLayout({ title, actions, children }) {
  const { logout, user } = useAuth();
  const navItems =
    user?.role === "ADMIN"
      ? [...NAV_ITEMS, { to: "/admin", label: "Admin", icon: "admin_panel_settings" }]
      : NAV_ITEMS;

  return (
    <div className="min-h-dvh bg-surface-container-low dark:bg-dark-background text-on-background dark:text-dark-on-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-md focus:py-sm focus:rounded-lg focus:bg-primary focus:text-on-primary focus:shadow-lg"
      >
        Lewati ke konten utama
      </a>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-60 flex-col bg-surface-container-lowest dark:bg-dark-surface-container-lowest border-r border-outline-variant/40 dark:border-dark-outline-variant/40 z-30">
        <div className="flex items-center gap-md px-md h-16 border-b border-outline-variant/40 dark:border-dark-outline-variant/40">
          <img
            src="/images/logo.webp"
            alt="Finora AI Logo"
            className="h-10 w-auto object-contain shrink-0 filter drop-shadow-sm"
          />
          <span className="font-bold text-lg tracking-tight">Finora AI</span>
        </div>

        <nav aria-label="Navigasi utama" className="flex-1 p-sm space-y-xs">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-sm min-h-11 px-md rounded-lg text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container"
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-sm border-t border-outline-variant/40 dark:border-dark-outline-variant/40">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-sm min-h-11 px-md rounded-lg text-body-sm font-medium cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-danger/10 hover:text-danger dark:hover:text-dark-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              logout
            </span>
            Keluar
          </button>
        </div>
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 right-0 left-0 md:left-60 h-16 z-20 bg-surface-container-lowest dark:bg-dark-surface-container-lowest border-b border-outline-variant/40 dark:border-dark-outline-variant/40 flex items-center justify-between px-md gap-sm">
        <div className="flex items-center gap-sm min-w-0">
          <img
            src="/images/logo.webp"
            alt="Finora AI Logo"
            className="md:hidden h-8 w-auto object-contain shrink-0 filter drop-shadow-sm"
          />
          <h1 className="font-semibold text-lg truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          {actions}
          <ProfileChip />
          <NotificationBell />
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar"
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              logout
            </span>
          </button>
        </div>
      </header>

      {/* pb mobile menyediakan ruang untuk bottom nav + area aman gesture bar. */}
      <main
        id="main"
        className="md:ml-60 pt-16 px-md md:px-lg pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-md"
      >
        <div className="max-w-6xl mx-auto py-md">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav
        aria-label="Navigasi utama"
        className="md:hidden fixed bottom-0 left-0 w-full z-30 bg-surface-container-lowest dark:bg-dark-surface-container-lowest border-t border-outline-variant/40 dark:border-dark-outline-variant/40 flex pb-[env(safe-area-inset-bottom)]"
      >
        {MOBILE_NAV_ITEMS.map((item, i) =>
          item === null ? (
            // Slot tengah kosong: tombol tambah transaksi mengambang, gaya FundFlex.
            // Link (bukan NavLink) — query ?new=1 dibaca mobile/Transactions.jsx
            // untuk auto-buka modal create, tanpa menduplikasi state modal di sini.
            <div key="fab" className="flex-1 flex items-center justify-center">
              <Link
                to="/transactions?new=1"
                aria-label="Tambah transaksi"
                className="w-12 h-12 -mt-5 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center cursor-pointer hover:brightness-110 motion-safe:active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
                  add
                </span>
              </Link>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-[2px] min-h-14 py-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                  isActive ? "text-primary" : "text-on-surface-variant dark:text-dark-on-surface-variant"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </nav>
    </div>
  );
}
