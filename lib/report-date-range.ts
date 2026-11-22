import { format, startOfMonth, subDays } from "date-fns"

export type ReportRangePreset =
  | "last_30_days"
  | "last_14_days"
  | "this_month"
  | "custom"

export const REPORT_RANGE_PRESETS: { value: ReportRangePreset; label: string }[] =
  [
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_14_days", label: "Last 14 days" },
    { value: "this_month", label: "This month" },
    { value: "custom", label: "Custom range" },
  ]

/** Both ends included, as `YYYY-MM-DD`: the form the report API takes. */
export type ReportDateRange = { start_date: string; end_date: string }

function toApiDate(date: Date) {
  return format(date, "yyyy-MM-dd")
}

/** The dates a preset covers, counted back from `today` in local time. */
export function presetRange(
  preset: Exclude<ReportRangePreset, "custom">,
  today: Date,
): ReportDateRange {
  const end_date = toApiDate(today)
  switch (preset) {
    case "last_30_days":
      return { start_date: toApiDate(subDays(today, 29)), end_date }
    case "last_14_days":
      return { start_date: toApiDate(subDays(today, 13)), end_date }
    case "this_month":
      return { start_date: toApiDate(startOfMonth(today)), end_date }
  }
}

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/

/** Why a custom range cannot be applied, or null when it can. */
export function customRangeError(range: ReportDateRange): string | null {
  if (!range.start_date || !range.end_date) {
    return "Pick a start date and an end date."
  }
  // A date input accepts years of up to 6 digits, which the API rejects.
  if (!YYYY_MM_DD.test(range.start_date) || !YYYY_MM_DD.test(range.end_date)) {
    return "Enter dates with a 4-digit year."
  }
  if (range.end_date < range.start_date) {
    return "The end date must be on or after the start date."
  }
  return null
}
