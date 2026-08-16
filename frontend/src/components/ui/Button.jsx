import { cn } from "../../utils/cn";

const VARIANTS = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-container active:bg-primary-container shadow-sm",
  outline:
    "border border-outline-variant dark:border-dark-outline-variant text-on-surface dark:text-dark-on-background bg-surface-container-lowest dark:bg-dark-surface-container-lowest hover:bg-surface-container dark:hover:bg-dark-surface-container",
  ghost:
    "text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container",
  danger: "bg-danger text-white hover:bg-red-800 shadow-sm",
};

export function Button({ className, variant = "primary", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cn(
        // min-h-11 = 44px, memenuhi ukuran target sentuh minimum.
        "inline-flex items-center justify-center gap-xs min-h-11 px-4 py-2 rounded-lg font-medium text-body-sm",
        "cursor-pointer touch-manipulation transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "focus-visible:ring-offset-surface-container-lowest dark:focus-visible:ring-offset-dark-background",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
