import { useMediaQuery } from "../hooks/useMediaQuery";
import { Register as DesktopRegister } from "./desktop/Register";
import { Register as MobileRegister } from "./mobile/Register";

export function Register() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? <DesktopRegister /> : <MobileRegister />;
}
