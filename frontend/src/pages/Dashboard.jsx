import { useMediaQuery } from "../hooks/useMediaQuery";
import { Dashboard as DesktopDashboard } from "./desktop/Dashboard";
import { Dashboard as MobileDashboard } from "./mobile/Dashboard";

export function Dashboard() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? <DesktopDashboard /> : <MobileDashboard />;
}
