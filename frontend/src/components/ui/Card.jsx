import { cn } from "../../utils/cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest dark:bg-dark-surface-container-lowest",
        "text-on-background dark:text-dark-on-background",
        "border border-outline-variant/40 dark:border-dark-outline-variant/40",
        "rounded-xl shadow-sm p-6",
        className
      )}
      {...props}
    />
  );
}
