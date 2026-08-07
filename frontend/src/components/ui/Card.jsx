import { cn } from "../../utils/cn";

export function Card({ className, ...props }) {
  return <div className={cn("bg-white dark:bg-dark-surface-container-lowest text-on-background dark:text-dark-on-background rounded-lg shadow p-6", className)} {...props} />;
}
