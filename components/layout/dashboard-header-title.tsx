"use client"

import { usePathname } from "next/navigation"

import { getDashboardPageTitle } from "@/lib/dashboard-nav"

export function DashboardHeaderTitle() {
  const pathname = usePathname()
  return (
    <h1 className="text-sm font-medium sm:text-base">
      {getDashboardPageTitle(pathname)}
    </h1>
  )
}
