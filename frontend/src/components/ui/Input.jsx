import { cn } from "../../utils/cn";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 border border-gray-300 dark:border-dark-outline-variant rounded-md bg-white dark:bg-dark-surface-container-lowest text-on-background dark:text-dark-on-background focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    />
  );
}
