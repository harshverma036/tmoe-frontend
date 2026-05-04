"use client"

import { useEffect } from "react"
import Cookies from "js-cookie"
import { useRouter, useSearchParams } from "next/navigation"

import appConfig from "@/lib/appConfig"

import BrandProfileForm from "./brand-form"
import PublisherProfileForm from "./publisher-form"

type ProfileType = "BRAND" | "PUBLISHER"

function roleFromUserInfoCookie(): ProfileType | null {
  const raw = Cookies.get(appConfig.cookies.userInfoKey)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }
    const role = String((parsed as { role?: string }).role ?? "").toUpperCase()
    if (role === "BRAND" || role === "PUBLISHER") return role
  } catch {
    return null
  }
  return null
}

/**
 * Picks publisher vs brand onboarding from the `type` search param, falling
 * back to `role` in the user-info cookie. Keeps the URL in sync with the
 * resolved role.
 */
const CompleteProfileWizard = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramType = searchParams.get("type")?.toUpperCase()

  const cookieRole = roleFromUserInfoCookie()
  const resolvedRole: ProfileType =
    cookieRole ??
    (paramType === "BRAND" || paramType === "PUBLISHER" ? paramType : "PUBLISHER")

  useEffect(() => {
    if (paramType === resolvedRole) return
    router.replace(`/complete-profile?type=${resolvedRole}`)
  }, [paramType, resolvedRole, router])

  if (resolvedRole === "BRAND") {
    return <BrandProfileForm />
  }

  return <PublisherProfileForm />
}

export default CompleteProfileWizard
