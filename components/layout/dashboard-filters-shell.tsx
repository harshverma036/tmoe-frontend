"use client"

import { Suspense } from "react"

import { DashboardFiltersProvider } from "@/components/layout/dashboard-filters-provider"

function DashboardFiltersProviderFallback({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

export function DashboardFiltersShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<DashboardFiltersProviderFallback>{children}</DashboardFiltersProviderFallback>}>
      <DashboardFiltersProvider>{children}</DashboardFiltersProvider>
    </Suspense>
  )
}
