import { cn } from "../../utils/cn";

// text-base di mobile mencegah iOS auto-zoom saat field difokus (butuh >=16px),
// lalu turun ke text-body-sm di layar besar.
export const FIELD_BASE =
  "w-full min-h-11 px-3 py-2 rounded-lg text-base sm:text-body-sm " +
  "border border-outline-variant dark:border-dark-outline-variant " +
  "bg-surface-container-lowest dark:bg-dark-surface-container-lowest " +
  "text-on-background dark:text-dark-on-background " +
  "transition-colors duration-150 " +
  "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        FIELD_BASE,
        "placeholder:text-outline dark:placeholder:text-dark-outline",
        className
      )}
      {...props}
    />
  );
}
