import { useMediaQuery } from "../hooks/useMediaQuery";
import { Login as DesktopLogin } from "./desktop/Login";
import { Login as MobileLogin } from "./mobile/Login";

export function Login() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return isDesktop ? <DesktopLogin /> : <MobileLogin />;
}
