import { Admin as DesktopAdmin } from "./desktop/Admin";

// Admin scope desktop-only per requirement — tidak ada split mobile.
export function Admin() {
  return <DesktopAdmin />;
}
