"use client"

import * as React from "react"
import { Calendar, ChevronDown, Search } from "lucide-react"

import { useDashboardFilters } from "@/components/layout/dashboard-filters-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  getDateRangeLabel,
  type DashboardSearchField,
} from "@/lib/dashboard-filters"
import { cn } from "@/lib/utils"

function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
) {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback

  return React.useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    return ((...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => callbackRef.current(...args), delay)
    }) as T
  }, [delay])
}

const SEARCH_FIELDS: { value: DashboardSearchField; label: string }[] = [
  { value: "all", label: "All fields" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "role", label: "Role" },
]

export function UsersTableFilters() {
  const {
    search,
    searchField,
    dateRange,
    setSearch,
    setSearchField,
    setDateRange,
  } = useDashboardFilters()

  const [localSearch, setLocalSearch] = React.useState(search)

  React.useEffect(() => {
    setLocalSearch(search)
  }, [search])

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearch(value)
  }, 300)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-10 shrink-0 gap-1 rounded-xl border-border/80 bg-card px-3 shadow-none"
          >
            {SEARCH_FIELDS.find((field) => field.value === searchField)?.label ??
              "All fields"}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SEARCH_FIELDS.map((field) => (
            <DropdownMenuItem
              key={field.value}
              onSelect={() => setSearchField(field.value)}
            >
              {field.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, role..."
          value={localSearch}
          onChange={(event) => {
            const value = event.target.value
            setLocalSearch(value)
            debouncedSetSearch(value)
          }}
          className="h-10 rounded-xl border-border/80 bg-muted/30 pl-9 shadow-none"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 gap-2 rounded-xl border-border/80 bg-card px-3 shadow-none",
              dateRange && "border-primary/30 bg-primary/5"
            )}
          >
            <Calendar className="size-4 text-muted-foreground" />
            {getDateRangeLabel(dateRange)}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDateRange("")}>
            All time
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDateRange("30")}>
            Last 30 days
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDateRange("90")}>
            Last 90 days
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
