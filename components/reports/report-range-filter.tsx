"use client"

import { useState } from "react"

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
import {
  customRangeError,
  presetRange,
  REPORT_RANGE_PRESETS,
  type ReportDateRange,
  type ReportRangePreset,
} from "@/lib/report-date-range"

type ReportRangeFilterProps = {
  /** The range the report is showing. */
  value: ReportDateRange
  onChange: (range: ReportDateRange) => void
  /** The preset the page starts on; the page's initial `value` must match it. */
  initialPreset?: Exclude<ReportRangePreset, "custom">
}

/**
 * Date range picker for the Reports page: a preset applies as soon as it is picked; a custom
 * range applies on Apply, so the report is not fetched for every half-typed date.
 */
export function ReportRangeFilter({
  value,
  onChange,
  initialPreset = "last_30_days",
}: ReportRangeFilterProps) {
  const [preset, setPreset] = useState<ReportRangePreset>(initialPreset)
  const [draft, setDraft] = useState<ReportDateRange>(value)

  const error = customRangeError(draft)
  const unchanged =
    draft.start_date === value.start_date && draft.end_date === value.end_date

  const pickPreset = (next: ReportRangePreset) => {
    setPreset(next)
    if (next === "custom") {
      // Start from the dates on screen, so switching to Custom changes nothing by itself.
      setDraft(value)
      return
    }
    onChange(presetRange(next, new Date()))
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="report-range">Date range</Label>
        <Select
          value={preset}
          onValueChange={(next) => pickPreset(next as ReportRangePreset)}
        >
          <SelectTrigger id="report-range" className="h-9 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_RANGE_PRESETS.map((option) => (
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
            <Label htmlFor="report-start">Start</Label>
            <Input
              id="report-start"
              type="date"
              value={draft.start_date}
              max={draft.end_date || "9999-12-31"}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, start_date: event.target.value }))
              }
              className="w-42"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-end">End</Label>
            <Input
              id="report-end"
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
            // order-last keeps the filter bar's other controls on one row above the message.
            <p className="order-last basis-full text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </>
  )
}
