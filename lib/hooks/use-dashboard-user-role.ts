"use client"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"

import { normalizeUserRole, type UserRole } from "@/lib/dashboard-nav"
import appConfig from "@/lib/appConfig"

/**
 * Reads `role` from the user-info cookie after mount (client-only).
 * Used to choose which settings sections and profile APIs apply.
 */
export function useDashboardUserRole(): {
  role: UserRole | null
  isReady: boolean
} {
  const [state, setState] = useState<{
    role: UserRole | null
    isReady: boolean
  }>({ role: null, isReady: false })

  useEffect(() => {
    const raw = Cookies.get(appConfig.cookies.userInfoKey)
    let role: UserRole | null = null
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { role?: string }
        role = normalizeUserRole(parsed.role)
      } catch {
        role = null
      }
    }
    setState({ role, isReady: true })
  }, [])

  return { role: state.role, isReady: state.isReady }
}
