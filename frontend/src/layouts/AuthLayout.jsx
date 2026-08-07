import { ThemeToggle } from "../components/ui/ThemeToggle";

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-background">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="w-full max-w-sm bg-white dark:bg-dark-surface-container-lowest text-on-background dark:text-dark-on-background p-8 rounded-lg shadow">
        {children}
      </div>
    </div>
  );
}
