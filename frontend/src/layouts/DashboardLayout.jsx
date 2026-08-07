import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export function DashboardLayout({ children }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background">
      <header className="bg-white dark:bg-dark-surface-container-lowest shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-primary">AI Personal Finance</h1>
        <div className="flex items-center gap-sm">
          <ThemeToggle />
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="p-6 text-on-background dark:text-dark-on-background">{children}</main>
    </div>
  );
}
