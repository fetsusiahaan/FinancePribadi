import { cn } from "../../utils/cn";
import { FIELD_BASE } from "./Input";

export function Select({ className, children, ...props }) {
  return (
    // appearance-none melepas panah bawaan browser (yang nempel ke tepi tanpa jarak);
    // chevron custom diberi ruang pr-10 supaya tidak nempel ke pinggir/teks.
    <div className="relative">
      <select
        className={cn(FIELD_BASE, "appearance-none pr-10 cursor-pointer", className)}
        {...props}
      >
        {children}
      </select>
      <span
        className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant dark:text-dark-on-surface-variant pointer-events-none"
        aria-hidden="true"
      >
        expand_more
      </span>
    </div>
  );
}
