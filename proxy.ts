import { NextRequest, NextResponse } from "next/server"
import appConfig from "./lib/appConfig"

const AUTH_ROUTE_SEGMENTS = [
  "sign-in",
  "sign-up",
  "complete-profile",
  "verify-email",
  "waiting-approval",
] as const

function firstPathSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? ""
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const segment = firstPathSegment(pathname)

  const raw = request.cookies.get(appConfig.cookies.userInfoKey)?.value
  let userInfoData: {
    name: string
    email: string
    active: boolean
    admin_approved: boolean
    profile_completed: boolean
    email_verified_at: string | null
    role: string
    id: string
  } | null = null

  if (raw) {
    try {
      userInfoData = JSON.parse(raw)
    } catch {
      userInfoData = null
    }
  }

  const isUserAllowed = Boolean(
    userInfoData?.active && userInfoData?.admin_approved
  )

  const isAuthRoute = AUTH_ROUTE_SEGMENTS.includes(
    segment as (typeof AUTH_ROUTE_SEGMENTS)[number]
  )

  if (!userInfoData) {
    if (isAuthRoute) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  const role = (userInfoData.role ?? "").toUpperCase()
  const isBrandOrPublisher = role === "BRAND" || role === "PUBLISHER"

  if (
    isBrandOrPublisher &&
    !userInfoData.email_verified_at
  ) {
    const verifyUrl = new URL("/verify-email", request.url)
    verifyUrl.searchParams.set("email", userInfoData.email)
    return NextResponse.redirect(verifyUrl)
  }

  if (isBrandOrPublisher && !userInfoData.profile_completed) {
    const completeProfilePath = `/complete-profile`
    if (pathname !== completeProfilePath) {
      return NextResponse.redirect(new URL(completeProfilePath, request.url))
    }
    return NextResponse.next()
  }

  if (!isUserAllowed) {
    if (pathname !== "/waiting-approval") {
      return NextResponse.redirect(new URL("/waiting-approval", request.url))
    }
    return NextResponse.next()
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/insights", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
