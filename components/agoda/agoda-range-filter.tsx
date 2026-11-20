"use client"

import { useState } from "react"
import {
  endOfMonth,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { customRangeError, type ReportDateRange } from "@/lib/report-date-range"

export type AgodaRangePreset =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "year_to_date"
  | "all_data"
  | "custom"

const PRESETS: { value: AgodaRangePreset; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "year_to_date", label: "Year to date" },
  { value: "all_data", label: "All imported data" },
  { value: "custom", label: "Custom range" },
]

const day = (date: Date) => format(date, "yyyy-MM-dd")

/**
 * The dates a preset covers. "Last 3 months" is whole calendar months: this one and the two
 * before it. "All imported data" runs from the first stored booking to today.
 */
export function agodaPresetRange(
  preset: Exclude<AgodaRangePreset, "custom">,
  today: Date,
  firstBookingDate: string | null
): ReportDateRange {
  const end_date = day(today)
  switch (preset) {
    case "this_month":
      return { start_date: day(startOfMonth(today)), end_date }
    case "last_month": {
      const last = subMonths(today, 1)
      return {
        start_date: day(startOfMonth(last)),
        end_date: day(endOfMonth(last)),
      }
    }
    case "last_3_months":
      return { start_date: day(startOfMonth(subMonths(today, 2))), end_date }
    case "year_to_date":
      return { start_date: day(startOfYear(today)), end_date }
    case "all_data":
      return {
        start_date: firstBookingDate ?? day(startOfYear(today)),
        end_date,
      }
  }
}

/** A preset applies as soon as it is picked; a custom range applies on Apply. */
export function AgodaRangeFilter({
  value,
  onChange,
  preset,
  onPresetChange,
  firstBookingDate,
}: {
  value: ReportDateRange
  onChange: (range: ReportDateRange) => void
  preset: AgodaRangePreset
  onPresetChange: (preset: AgodaRangePreset) => void
  firstBookingDate: string | null
}) {
  const [draft, setDraft] = useState<ReportDateRange>(value)
  const error = customRangeError(draft)
  const unchanged =
    draft.start_date === value.start_date && draft.end_date === value.end_date

  const pick = (next: AgodaRangePreset) => {
    onPresetChange(next)
    if (next === "custom") {
      setDraft(value)
      return
    }
    onChange(agodaPresetRange(next, new Date(), firstBookingDate))
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="agoda-range">Date range</Label>
        <Select
          value={preset}
          onValueChange={(next) => pick(next as AgodaRangePreset)}
        >
          <SelectTrigger id="agoda-range" className="h-9 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {preset === "custom" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="agoda-start">Start</Label>
            <Input
              id="agoda-start"
              type="date"
              value={draft.start_date}
              max={draft.end_date || "9999-12-31"}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  start_date: event.target.value,
                }))
              }
              className="w-42"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agoda-end">End</Label>
            <Input
              id="agoda-end"
              type="date"
              value={draft.end_date}
              min={draft.start_date || undefined}
              max="9999-12-31"
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, end_date: event.target.value }))
              }
              className="w-42"
            />
          </div>
          <Button
            type="button"
            onClick={() => onChange(draft)}
            disabled={error !== null || unchanged}
          >
            Apply
          </Button>
          {error ? (
            <p
              className="order-last basis-full text-xs text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </>
  )
}
