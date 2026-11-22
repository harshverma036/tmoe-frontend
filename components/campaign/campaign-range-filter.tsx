"use client"

import { useState } from "react"

import { agodaPresetRange } from "@/components/agoda/agoda-range-filter"
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
  type ReportDateRange,
} from "@/lib/report-date-range"

export type CampaignRangePreset =
  | "campaign"
  | "last_30_days"
  | "this_month"
  | "last_3_months"
  | "custom"

/** The campaign's own dates, when it has both. */
export function campaignRange(
  start: string | null,
  end: string | null,
): ReportDateRange | null {
  return start && end && start <= end ? { start_date: start, end_date: end } : null
}

export function campaignPresetRange(
  preset: Exclude<CampaignRangePreset, "custom">,
  campaignDates: ReportDateRange | null,
  today = new Date(),
): ReportDateRange {
  switch (preset) {
    case "campaign":
      return campaignDates ?? presetRange("last_30_days", today)
    case "last_30_days":
    case "this_month":
      return presetRange(preset, today)
    case "last_3_months":
      return agodaPresetRange("last_3_months", today, null)
  }
}

/**
 * Date range for a campaign's Performance tab. Starts on the campaign's own dates; a preset
 * applies as soon as it is picked, a custom range on Apply.
 */
export function CampaignRangeFilter({
  value,
  onChange,
  preset,
  onPresetChange,
  campaignDates,
}: {
  value: ReportDateRange
  onChange: (range: ReportDateRange) => void
  preset: CampaignRangePreset
  onPresetChange: (preset: CampaignRangePreset) => void
  campaignDates: ReportDateRange | null
}) {
  const [draft, setDraft] = useState<ReportDateRange>(value)
  const error = customRangeError(draft)
  const unchanged =
    draft.start_date === value.start_date && draft.end_date === value.end_date

  const presets: { value: CampaignRangePreset; label: string }[] = [
    ...(campaignDates
      ? [
          { value: "campaign" as const, label: "Campaign dates" },
        ]
      : []),
    { value: "last_30_days", label: "Last 30 days" },
    { value: "this_month", label: "This month" },
    { value: "last_3_months", label: "Last 3 months" },
    { value: "custom", label: "Custom range" },
  ]

  const pick = (next: CampaignRangePreset) => {
    onPresetChange(next)
    if (next === "custom") {
      // Start from the dates on screen, so switching to Custom changes nothing by itself.
      setDraft(value)
      return
    }
    onChange(campaignPresetRange(next, campaignDates))
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="campaign-range">Date range</Label>
        <Select
          value={preset}
          onValueChange={(next) => pick(next as CampaignRangePreset)}
        >
          <SelectTrigger id="campaign-range" className="h-9 w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((option) => (
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
            <Label htmlFor="campaign-range-start">Start</Label>
            <Input
              id="campaign-range-start"
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
            <Label htmlFor="campaign-range-end">End</Label>
            <Input
              id="campaign-range-end"
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
            <p className="order-last basis-full text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </>
  )
}
