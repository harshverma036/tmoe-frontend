import Cookies from "js-cookie"

import appConfig from "@/lib/appConfig"
import type { PersonalInformationValues } from "@/lib/validation/settings-forms"

/** User id from the signed-in user cookie, if present. */
export function getUserIdFromCookie(): string | null {
  const raw = Cookies.get(appConfig.cookies.userInfoKey)
  if (!raw) return null
  try {
    const u = JSON.parse(raw) as { id?: string }
    return typeof u.id === "string" && u.id ? u.id : null
  } catch {
    return null
  }
}

/** Name/email from the signed-in user cookie (e.g. admin has no publisher/brand profile GET). */
export function getPersonalInformationFromCookie(): PersonalInformationValues {
  const raw = Cookies.get(appConfig.cookies.userInfoKey)
  if (!raw) return { name: "", email: "" }
  try {
    const u = JSON.parse(raw) as { name?: string; email?: string }
    return {
      name: typeof u.name === "string" ? u.name : "",
      email: typeof u.email === "string" ? u.email : "",
    }
  } catch {
    return { name: "", email: "" }
  }
}
