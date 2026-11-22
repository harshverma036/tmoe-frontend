"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Search } from "lucide-react"

import { StatusBadge } from "@/components/common/StatusBadge"
import { TablePagination } from "@/components/common/TablePagination"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  apiMessage,
  formatDate,
  formatInt,
  formatMonth,
  formatUsd,
  STATUS_GROUP_BADGE,
  STATUS_GROUP_LABEL,
} from "@/lib/agoda-format"
import {
  agodaQueryKeys,
  fetchAgodaBookings,
  type AgodaBooking,
  type AgodaBookingSort,
  type AgodaBookingsParams,
  type AgodaReportParams,
  type Paged,
  type AgodaStatusGroup,
} from "@/lib/api/agoda"

const PAGE_SIZE = 25
const ALL = "all"

const STATUS_OPTIONS: {
  value: AgodaStatusGroup | typeof ALL
  label: string
}[] = [
  { value: ALL, label: "All statuses" },
  { value: "departed", label: "Departed" },
  { value: "charged", label: "Charged" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
]

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "booking_date:desc", label: "Newest booking" },
  { value: "booking_date:asc", label: "Oldest booking" },
  { value: "check_out_date:asc", label: "Check-out, soonest" },
  { value: "booking_value:desc", label: "Highest value" },
  { value: "commission:desc", label: "Highest commission" },
]

/** Every booking in the range, filtered and paged on the server. */
export function AgodaBookingsTable({
  params,
  countries,
  fetchBookings = fetchAgodaBookings,
  scopeKey = "all",
}: {
  params: AgodaReportParams
  countries: { name: string; bookings: number }[]
  /** Where the rows come from; the admin Agoda API unless a campaign passes its own. */
  fetchBookings?: (params: AgodaBookingsParams) => Promise<Paged<AgodaBooking>>
  /** Tells cached pages from different sources apart (e.g. a campaign id). */
  scopeKey?: string
}) {
  const [searchDraft, setSearchDraft] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>(ALL)
  const [country, setCountry] = useState<string>(ALL)
  const [sort, setSort] = useState(SORT_OPTIONS[0].value)
  const [page, setPage] = useState(1)

  // Search waits for a pause in typing, so each key press is not a request.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchDraft])

  // Any filter change goes back to page 1 (React's "adjust state while rendering" pattern).
  const filterKey = JSON.stringify([params, search, status, country, sort])
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const [sortField, order] = sort.split(":") as [
    AgodaBookingSort,
    "asc" | "desc",
  ]
  const query = useQuery({
    queryKey: [
      ...agodaQueryKeys.bookings,
      scopeKey,
      params,
      search,
      status,
      country,
      sort,
      page,
    ],
    queryFn: () =>
      fetchBookings({
        ...params,
        search: search || undefined,
        status: status === ALL ? undefined : (status as AgodaStatusGroup),
        destination_country: country === ALL ? undefined : country,
        sort: sortField,
        order,
        page,
        limit: PAGE_SIZE,
      }),
    keepPreviousData: true,
  })

  const data = query.data
  const total = data?.total ?? 0
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
        <CardDescription>
          Every booking in this range, as Agoda last reported it. Amounts are
          USD.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <div className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
              {query.isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </div>
            <Input
              placeholder="Booking ID, hotel, city…"
              className="pl-8"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              aria-label="Search bookings"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-full lg:w-40" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger
              className="h-9 w-full lg:w-48"
              aria-label="Destination country"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All destinations</SelectItem>
              {countries.map((option) => (
                <SelectItem key={option.name} value={option.name}>
                  {option.name} ({formatInt(option.bookings)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-full lg:w-48" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {query.isError ? (
          <p className="text-sm text-destructive">
            {apiMessage(query.error, "Could not load bookings.")}
          </p>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Stay</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No bookings match these filters.
                  </TableCell>
                </TableRow>
              ) : null}
              {!data && query.isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Loading bookings…
                  </TableCell>
                </TableRow>
              ) : null}
              {data?.items.map((b) => (
                <TableRow key={b.booking_id}>
                  <TableCell>
                    <p className="font-medium text-foreground tabular-nums">
                      {b.booking_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Booked {formatDate(b.booking_date)}
                      {b.device ? ` · ${b.device}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <p
                      className="truncate text-foreground"
                      title={b.property_name}
                    >
                      {b.property_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[b.destination_city, b.destination_country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <p className="text-foreground">
                      {b.check_in_date ? formatDate(b.check_in_date) : "—"} →{" "}
                      {formatDate(b.check_out_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.dmc ?? "—"} · paid {formatMonth(b.payment_month)}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {b.site_name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUsd(b.booking_value_usd)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {b.finalized_commission_usd !== null ? (
                      <span className="text-foreground">
                        {formatUsd(b.finalized_commission_usd)}
                      </span>
                    ) : b.estimated_commission_usd !== null ? (
                      <span className="text-muted-foreground">
                        est. {formatUsd(b.estimated_commission_usd)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {b.commission_rate !== null ? (
                      <p className="text-xs text-muted-foreground">
                        {b.commission_rate}%
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={b.status}
                      variant={STATUS_GROUP_BADGE[b.status_group]}
                    />
                    <span className="sr-only">
                      {STATUS_GROUP_LABEL[b.status_group]}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          showingFrom={from}
          showingTo={to}
          total={total}
          onPrevious={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          hasPrevious={page > 1}
          hasNext={to < total}
          isLoading={query.isFetching}
        />
      </CardContent>
    </Card>
  )
}
