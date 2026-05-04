"use client"

import type { iPagination, iTableSorting } from "@/components/common/DataTable"
import { useCallback, useState } from "react"

/** Default pagination passed to `DataTable` when using the shared hook without overrides. */
export const DEFAULT_DATA_TABLE_PAGINATION: iPagination = {
  pageIndex: 0,
  pageSize: 10,
}

export type UseDataTableStateOptions = {
  /**
   * Starting page index (0-based). Rarely changed; use when restoring URL-driven state.
   */
  initialPageIndex?: number
  /**
   * Rows per page. Should align with `DataTable` select options (10, 25, 50, 100).
   */
  initialPageSize?: number
  /** Initial search string shown in the table search input. */
  initialQuery?: string
  /** Initial column sort state (TanStack-style: column id + direction). */
  initialSorting?: iTableSorting[]
}

export type UseDataTableStateReturn = {
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
  sorting: iTableSorting[]
  setSorting: React.Dispatch<React.SetStateAction<iTableSorting[]>>
  pagination: iPagination
  setPagination: React.Dispatch<React.SetStateAction<iPagination>>
  /**
   * Sets `pageIndex` back to 0 while keeping `pageSize`.
   * Call when `query` or filters change so users are not left on an empty later page.
   */
  resetToFirstPage: () => void
}

/**
 * Shared UI state for {@link DataTable}: search query, sort order, and pagination.
 * Keeps pages consistent when wiring server queries: use these values in `queryKey`
 * and request params, and pass the same props through to `DataTable`.
 */
export function useDataTableState(
  options: UseDataTableStateOptions = {},
): UseDataTableStateReturn {
  const {
    initialPageIndex = DEFAULT_DATA_TABLE_PAGINATION.pageIndex,
    initialPageSize = DEFAULT_DATA_TABLE_PAGINATION.pageSize,
    initialQuery = "",
    initialSorting = [],
  } = options

  const [query, setQuery] = useState(initialQuery)
  const [sorting, setSorting] = useState<iTableSorting[]>(initialSorting)
  const [pagination, setPagination] = useState<iPagination>(() => ({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
  }))

  const resetToFirstPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  return {
    query,
    setQuery,
    sorting,
    setSorting,
    pagination,
    setPagination,
    resetToFirstPage,
  }
}
