import { cn } from "../../utils/cn";

export function Button({ className, variant = "primary", ...props }) {
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-700",
    outline: "border border-gray-300 dark:border-dark-outline-variant text-gray-700 dark:text-dark-on-background hover:bg-gray-50 dark:hover:bg-dark-surface-container",
  };
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
