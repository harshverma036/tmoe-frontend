"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  DASHBOARD_MODULE_FILTERS,
  type DashboardDateRange,
  type DashboardModuleId,
  type DashboardSearchField,
  getDashboardModuleFromPath,
} from "@/lib/dashboard-filters"

type DashboardFiltersContextValue = {
  moduleId: DashboardModuleId | null
  moduleConfig: (typeof DASHBOARD_MODULE_FILTERS)[DashboardModuleId] | null
  search: string
  searchField: DashboardSearchField
  dateRange: DashboardDateRange
  setSearch: (value: string) => void
  setSearchField: (value: DashboardSearchField) => void
  setDateRange: (value: DashboardDateRange) => void
  filtersActive: boolean
}

const DashboardFiltersContext =
  React.createContext<DashboardFiltersContextValue | null>(null)

const SEARCH_PARAM = "q"
const SEARCH_FIELD_PARAM = "searchField"
const DATE_RANGE_PARAM = "dateRange"

function parseSearchField(value: string | null): DashboardSearchField {
  if (value === "name" || value === "email" || value === "role") return value
  return "all"
}

function parseDateRange(value: string | null): DashboardDateRange {
  if (value === "30" || value === "90") return value
  return ""
}

export function DashboardFiltersProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const moduleId = getDashboardModuleFromPath(pathname)
  const moduleConfig = moduleId ? DASHBOARD_MODULE_FILTERS[moduleId] : null

  const search = searchParams.get(SEARCH_PARAM) ?? ""
  const searchField = parseSearchField(searchParams.get(SEARCH_FIELD_PARAM))
  const dateRange = parseDateRange(searchParams.get(DATE_RANGE_PARAM))

  const updateParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const setSearch = React.useCallback(
    (value: string) => {
      updateParams({ [SEARCH_PARAM]: value.trim() ? value : null })
    },
    [updateParams]
  )

  const setSearchField = React.useCallback(
    (value: DashboardSearchField) => {
      updateParams({
        [SEARCH_FIELD_PARAM]: value === "all" ? null : value,
      })
    },
    [updateParams]
  )

  const setDateRange = React.useCallback(
    (value: DashboardDateRange) => {
      updateParams({ [DATE_RANGE_PARAM]: value || null })
    },
    [updateParams]
  )

  const value = React.useMemo<DashboardFiltersContextValue>(
    () => ({
      moduleId,
      moduleConfig,
      search,
      searchField,
      dateRange,
      setSearch,
      setSearchField,
      setDateRange,
      filtersActive: Boolean(search || dateRange || searchField !== "all"),
    }),
    [
      moduleId,
      moduleConfig,
      search,
      searchField,
      dateRange,
      setSearch,
      setSearchField,
      setDateRange,
    ]
  )

  return (
    <DashboardFiltersContext.Provider value={value}>
      {children}
    </DashboardFiltersContext.Provider>
  )
}

export function useDashboardFilters() {
  const context = React.useContext(DashboardFiltersContext)
  if (!context) {
    throw new Error("useDashboardFilters must be used within DashboardFiltersProvider")
  }
  return context
}

export function useDashboardFiltersOptional() {
  return React.useContext(DashboardFiltersContext)
}
