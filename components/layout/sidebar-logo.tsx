"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import Cookies from "js-cookie"

import {
  brandReportScopeQueryKey,
  fetchBrandReportScope,
} from "@/lib/api/brand-report-scope"
import { BRAND_LOGO_COOKIE, type BrandLogo } from "@/lib/brand-logo"

const LOGOS: Record<"tmoe" | BrandLogo, { src: string; alt: string; width: number; height: number }> = {
  tmoe: { src: "/tmoe.svg", alt: "TMOE", width: 226, height: 131 },
  agoda: { src: "/brands/agoda.svg", alt: "Agoda", width: 600, height: 309 },
}

/**
 * The sidebar logo: TMOE's, or the brand's own for a brand that has one (Agoda). The brand is
 * looked up once per session and remembered in a cookie, which the layout reads so later page
 * loads show the right logo straight away.
 */
export function SidebarLogo({
  role,
  initialBrand,
}: {
  role: string | null | undefined
  initialBrand: BrandLogo | null
}) {
  const isBrand = role?.toUpperCase() === "BRAND"
  const scopeQuery = useQuery({
    queryKey: brandReportScopeQueryKey,
    queryFn: fetchBrandReportScope,
    enabled: isBrand,
    staleTime: 5 * 60 * 1000,
  })

  // The cookie's answer until the lookup comes back; a non-brand never shows a brand logo.
  const brand: BrandLogo | null = !isBrand
    ? null
    : scopeQuery.isSuccess
      ? scopeQuery.data?.is_agoda
        ? "agoda"
        : null
      : initialBrand

  useEffect(() => {
    if (!isBrand || !scopeQuery.isSuccess) return
    if (brand) Cookies.set(BRAND_LOGO_COOKIE, brand, { path: "/", expires: 30, sameSite: "lax" })
    else Cookies.remove(BRAND_LOGO_COOKIE, { path: "/" })
  }, [isBrand, scopeQuery.isSuccess, brand])

  const logo = LOGOS[brand ?? "tmoe"]
  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority
      className="h-11 w-auto max-w-[min(100%,10rem)] object-contain object-center group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:max-w-9"
    />
  )
}
