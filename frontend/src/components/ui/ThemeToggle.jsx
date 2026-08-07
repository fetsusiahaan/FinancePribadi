import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../utils/cn";

export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={cn(
        "p-sm rounded-full bg-surface-container-lowest/80 dark:bg-surface-container-high/80 backdrop-blur border border-outline-variant/50 text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest dark:hover:bg-surface-container-high shadow-sm transition-all flex items-center justify-center",
        className
      )}
    >
      <span className="material-symbols-outlined">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
    </button>
  );
}
