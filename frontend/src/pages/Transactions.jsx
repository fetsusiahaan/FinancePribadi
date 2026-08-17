import { useMediaQuery } from "../hooks/useMediaQuery";
import { Transactions as DesktopTransactions } from "./desktop/Transactions";
import { Transactions as MobileTransactions } from "./mobile/Transactions";

export function Transactions() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? <DesktopTransactions /> : <MobileTransactions />;
}
