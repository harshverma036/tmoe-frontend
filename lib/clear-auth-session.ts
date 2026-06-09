import Cookies from "js-cookie"

import appConfig from "./appConfig"

/** Removes auth cookies and client storage. Safe to call when already logged out. */
export function clearAuthSession(): void {
  Cookies.remove(appConfig.cookies.userTokenKey, { path: "/" })
  Cookies.remove(appConfig.cookies.userInfoKey, { path: "/" })
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    /* ignore quota / private mode */
  }
}
