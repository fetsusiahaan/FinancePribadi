import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ADMIN_NAV, ADMIN_FLAT_ROUTES } from "../config/adminNav";

// Grup yang berisi route aktif saat mount (mis. buka langsung /admin/ai/models).
function groupIdForPath(pathname) {
  const match = ADMIN_FLAT_ROUTES.find((r) => r.path === pathname);
  return match?.groupId ?? "dashboard";
}

function SidebarContent({ expanded, onToggleGroup, onNavigate }) {
  return (
    <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto p-sm space-y-xs">
      {ADMIN_NAV.map((group) => {
        const isOpen = expanded.has(group.id);
        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => onToggleGroup(group.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-sm min-h-11 px-md rounded-lg text-body-sm font-semibold cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {group.icon}
              </span>
              <span className="flex-1 text-left">{group.label}</span>
              <span
                className="material-symbols-outlined text-[18px] transition-transform"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-hidden="true"
              >
                expand_more
              </span>
            </button>

            {isOpen && (
              <div className="mt-xs ml-md pl-sm space-y-[2px] border-l border-outline-variant/40 dark:border-dark-outline-variant/40">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-sm min-h-10 px-md rounded-lg text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container"
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => new Set([groupIdForPath(location.pathname)]));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Buka grup yang berisi route aktif tiap kali pindah halaman (mis. klik
  // langsung ke URL admin tertentu, bukan lewat klik header grup).
  useEffect(() => {
    const activeGroup = groupIdForPath(location.pathname);
    setExpanded((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
    setMobileOpen(false);
  }, [location.pathname]);

  function toggleGroup(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeRoute = ADMIN_FLAT_ROUTES.find((r) => r.path === location.pathname);
  const pageTitle = activeRoute?.label ?? "Admin";

  const sidebarHeader = (
    <div className="flex items-center gap-md px-md h-16 border-b border-outline-variant/40 dark:border-dark-outline-variant/40 shrink-0">
      <img
        src="/images/logo.webp"
        alt="Finetra AI Logo"
        className="h-10 w-auto object-contain shrink-0 filter drop-shadow-sm"
      />
      <span className="font-bold text-lg tracking-tight">Finetra Admin</span>
    </div>
  );

  const sidebarFooter = (
    <div className="p-sm border-t border-outline-variant/40 dark:border-dark-outline-variant/40 shrink-0 space-y-xs">
      <Link
        to="/dashboard"
        className="w-full flex items-center gap-sm min-h-11 px-md rounded-lg text-body-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          arrow_back
        </span>
        Kembali ke App
      </Link>
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
  );

  return (
    <div className="min-h-dvh bg-surface-container-low dark:bg-dark-background text-on-background dark:text-dark-on-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 flex-col bg-surface-container-lowest dark:bg-dark-surface-container-lowest border-r border-outline-variant/40 dark:border-dark-outline-variant/40 z-30">
        {sidebarHeader}
        <SidebarContent expanded={expanded} onToggleGroup={toggleGroup} onNavigate={() => {}} />
        {sidebarFooter}
      </aside>

      {/* Sidebar mobile: off-canvas drawer + overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] flex flex-col bg-surface-container-lowest dark:bg-dark-surface-container-lowest border-r border-outline-variant/40 dark:border-dark-outline-variant/40 z-50 transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarHeader}
        <SidebarContent expanded={expanded} onToggleGroup={toggleGroup} onNavigate={() => setMobileOpen(false)} />
        {sidebarFooter}
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 right-0 left-0 md:left-64 h-16 z-20 bg-surface-container-lowest dark:bg-dark-surface-container-lowest border-b border-outline-variant/40 dark:border-dark-outline-variant/40 flex items-center justify-between px-md gap-sm">
        <div className="flex items-center gap-sm min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu admin"
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              menu
            </span>
          </button>
          <h1 className="font-semibold text-lg truncate">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="md:ml-64 pt-16 px-md md:px-lg pb-md">
        <div className="max-w-6xl mx-auto py-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
