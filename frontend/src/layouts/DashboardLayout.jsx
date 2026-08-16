import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "../components/ui/ThemeToggle";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/transactions", label: "Transaksi", icon: "receipt_long" },
  { to: "/budgets", label: "Budget", icon: "savings" },
];

export function DashboardLayout({ title, actions, children }) {
  const { logout } = useAuth();

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
        <div className="flex items-center gap-sm px-md h-16 border-b border-outline-variant/40 dark:border-dark-outline-variant/40">
          <span
            className="material-symbols-outlined text-primary text-3xl"
            style={{ fontVariationSettings: '"FILL" 1' }}
            aria-hidden="true"
          >
            hive
          </span>
          <span className="font-semibold text-lg tracking-tight">Finora AI</span>
        </div>

        <nav aria-label="Navigasi utama" className="flex-1 p-sm space-y-xs">
          {NAV_ITEMS.map((item) => (
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
          <span
            className="md:hidden material-symbols-outlined text-primary text-2xl"
            style={{ fontVariationSettings: '"FILL" 1' }}
            aria-hidden="true"
          >
            hive
          </span>
          <h1 className="font-semibold text-lg truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          {actions}
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
        {NAV_ITEMS.map((item) => (
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
        ))}
      </nav>
    </div>
  );
}
