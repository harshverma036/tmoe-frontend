import { format, parseISO } from "date-fns"
import type { AxiosError } from "axios"

import type {
  AgodaDateBasis,
  AgodaInterval,
  AgodaStatusGroup,
} from "@/lib/api/agoda"

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})
const integer = new Intl.NumberFormat("en-US")
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

/** $1,234.56 */
export const formatUsd = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : usd.format(value)

/** $1,235 under $100K, then $123.4K. For headline figures. */
export const formatUsdHeadline = (value: number) =>
  Math.abs(value) >= 100_000 ? usdCompact.format(value) : usdWhole.format(value)

/** Axis ticks: $0, $500, $1.2K… */
export const formatUsdAxis = (value: number) =>
  Math.abs(value) >= 1000 ? usdCompact.format(value) : usdWhole.format(value)

export const formatInt = (value: number) => integer.format(value)
export const formatCompact = (value: number) =>
  Math.abs(value) >= 10_000 ? compact.format(value) : integer.format(value)

/** 0.2628 → "26.3%"; a share too small to show is "<0.1%", not "0.0%". */
export function formatPct(value: number, digits = 1) {
  const smallest = 10 ** -digits / 100
  if (value > 0 && value < smallest)
    return `<${(smallest * 100).toFixed(digits)}%`
  return `${(value * 100).toFixed(digits)}%`
}

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null

/** "IN" → "India". Agoda's Origin column is a two-letter country code. */
export function countryName(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return code
  try {
    return regionNames?.of(code) ?? code
  } catch {
    return code
  }
}

const date = (text: string) => parseISO(text)

/** "16 Sep 2026" */
export const formatDate = (text: string | null | undefined) =>
  text ? format(date(text), "d MMM yyyy") : "—"

/** "Oct 2026" */
export const formatMonth = (text: string | null | undefined) =>
  text ? format(date(text), "MMM yyyy") : "—"

/** "16 Sep – 30 Sep 2026", or with both years when they differ. */
export function formatRange(start: string, end: string) {
  const a = date(start)
  const b = date(end)
  return a.getFullYear() === b.getFullYear()
    ? `${format(a, "d MMM")} – ${format(b, "d MMM yyyy")}`
    : `${format(a, "d MMM yyyy")} – ${format(b, "d MMM yyyy")}`
}

/** An axis tick for one period of the series. */
export function formatPeriodTick(period: string, interval: AgodaInterval) {
  const d = date(period)
  // "Oct ’26", so a month is never read as a day ("Oct 26").
  if (interval === "month") return format(d, "MMM ’yy")
  return format(d, "d MMM")
}

/** A tooltip heading for one period. */
export function formatPeriodLabel(period: string, interval: AgodaInterval) {
  const d = date(period)
  if (interval === "month") return format(d, "MMMM yyyy")
  if (interval === "week") return `Week of ${format(d, "d MMM yyyy")}`
  return format(d, "EEE, d MMM yyyy")
}

export const DATE_BASIS_LABEL: Record<AgodaDateBasis, string> = {
  booking: "Booking date",
  checkout: "Check-out date",
  payment: "Payment month",
}

export const STATUS_GROUP_LABEL: Record<AgodaStatusGroup, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  charged: "Charged",
  departed: "Departed",
  cancelled: "Cancelled",
  other: "Other",
}

export const STATUS_GROUP_BADGE: Record<
  AgodaStatusGroup,
  "success" | "warning" | "info" | "danger" | "muted" | "default"
> = {
  departed: "success",
  charged: "info",
  confirmed: "info",
  pending: "warning",
  cancelled: "muted",
  other: "default",
}

/**
 * Change against the previous period, e.g. "+12.4% vs 2 Aug – 31 Aug". `upIsGood` decides the
 * colour: a rising cancellation rate is bad news.
 */
export function describeChange(
  current: number,
  previous: number,
  previousLabel: string,
  upIsGood = true
): { text: string; variant: "positive" | "negative" | "muted" } {
  if (previous === 0) {
    return {
      text:
        current === 0
          ? `No change vs ${previousLabel}`
          : `No data for ${previousLabel}`,
      variant: "muted",
    }
  }
  const change = (current - previous) / previous
  if (Math.abs(change) < 0.0005)
    return { text: `No change vs ${previousLabel}`, variant: "muted" }
  const sign = change > 0 ? "+" : "−"
  const good = change > 0 === upIsGood
  return {
    text: `${sign}${Math.abs(change * 100).toFixed(1)}% vs ${previousLabel}`,
    variant: good ? "positive" : "negative",
  }
}

/** Percentage-point change, for rates: "+2.1 pts vs …". */
export function describePointChange(
  current: number,
  previous: number,
  hadPrevious: boolean,
  previousLabel: string,
  upIsGood = false
): { text: string; variant: "positive" | "negative" | "muted" } {
  if (!hadPrevious)
    return { text: `No data for ${previousLabel}`, variant: "muted" }
  const points = (current - previous) * 100
  if (Math.abs(points) < 0.05)
    return { text: `No change vs ${previousLabel}`, variant: "muted" }
  const good = points > 0 === upIsGood
  return {
    text: `${points > 0 ? "+" : "−"}${Math.abs(points).toFixed(1)} pts vs ${previousLabel}`,
    variant: good ? "positive" : "negative",
  }
}

export function apiMessage(error: unknown, fallback: string) {
  const message = (error as AxiosError<{ message?: string | string[] }>)
    .response?.data?.message
  return (Array.isArray(message) ? message[0] : message) ?? fallback
}
