import Cookies from "js-cookie"

import appConfig from "./appConfig"
import { BRAND_LOGO_COOKIE } from "./brand-logo"

/** Removes auth cookies and client storage. Safe to call when already logged out. */
export function clearAuthSession(): void {
  Cookies.remove(appConfig.cookies.userTokenKey, { path: "/" })
  Cookies.remove(appConfig.cookies.userInfoKey, { path: "/" })
  Cookies.remove(BRAND_LOGO_COOKIE, { path: "/" })
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    /* ignore quota / private mode */
  }
}
