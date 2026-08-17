import { useMediaQuery } from "../hooks/useMediaQuery";
import { Budgets as DesktopBudgets } from "./desktop/Budgets";
import { Budgets as MobileBudgets } from "./mobile/Budgets";

export function Budgets() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? <DesktopBudgets /> : <MobileBudgets />;
}
