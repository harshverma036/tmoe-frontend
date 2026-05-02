import Cookies from "js-cookie"

import appConfig from "@/lib/appConfig"

const USER_INFO_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
} as const

/**
 * Reads the current user-info cookie (if present and valid JSON object),
 * merges `updates`, and persists under `appConfig.cookies.userInfoKey`.
 */
export function mergeUserInfoCookie(updates: Record<string, unknown>): void {
  const key = appConfig.cookies.userInfoKey
  const raw = Cookies.get(key)
  let existing: Record<string, unknown> = {}

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        existing = { ...(parsed as Record<string, unknown>) }
      }
    } catch {
      // Invalid JSON — write fresh object with updates only
    }
  }

  Cookies.set(key, JSON.stringify({ ...existing, ...updates }), {
    ...USER_INFO_COOKIE_OPTIONS,
  })
}
