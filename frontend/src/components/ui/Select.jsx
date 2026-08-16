import { cn } from "../../utils/cn";
import { FIELD_BASE } from "./Input";

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(FIELD_BASE, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}
