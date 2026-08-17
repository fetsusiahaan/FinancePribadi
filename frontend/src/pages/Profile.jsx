import { useMediaQuery } from "../hooks/useMediaQuery";
import { Profile as DesktopProfile } from "./desktop/Profile";
import { Profile as MobileProfile } from "./mobile/Profile";

export function Profile() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? <DesktopProfile /> : <MobileProfile />;
}
