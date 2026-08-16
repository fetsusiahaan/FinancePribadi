import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../utils/cn";

export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      aria-pressed={isDark}
      className={cn(
        "w-11 h-11 shrink-0 flex items-center justify-center rounded-full cursor-pointer",
        "border border-outline-variant/50 dark:border-dark-outline-variant/50",
        "text-on-surface-variant dark:text-dark-on-surface-variant",
        "hover:text-primary hover:bg-surface-container dark:hover:bg-dark-surface-container",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "transition-colors duration-150",
        className
      )}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
