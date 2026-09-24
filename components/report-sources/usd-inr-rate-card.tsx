"use client"

import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format } from "date-fns"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  reportSourceQueryKey,
  updateReportSource,
} from "@/lib/api/report-sources"
import type { ReportSource } from "@/lib/report-source.types"

/** The API's rule: above 0, at most 1,000, at most 4 decimal places. */
const RATE_PATTERN = /^\d+(\.\d{1,4})?$/
const MAX_RATE = 1000

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

function formatDateTime(value: string | null) {
  if (!value) return "—"
  try {
    return format(new Date(value), "dd MMM yyyy, HH:mm")
  } catch {
    return value
  }
}

export function UsdInrRateCard({ source }: { source: ReportSource }) {
  const queryClient = useQueryClient()
  /** null while the input shows the saved rate. */
  const [draft, setDraft] = useState<string | null>(null)

  const saved =
    source.usd_to_inr_rate === null ? "" : String(source.usd_to_inr_rate)
  const value = draft ?? saved

  const save = useMutation({
    mutationFn: (rate: number | null) =>
      updateReportSource(source.id, { usd_to_inr_rate: rate }),
    onSuccess: (updated) => {
      // The PATCH returns the whole sheet, so the card shows the new rate without waiting for
      // a refetch (and without flashing the old one first).
      queryClient.setQueryData(reportSourceQueryKey(source.id), updated)
      setDraft(null)
      toast.success(
        updated.usd_to_inr_rate === null
          ? "Dollar rate removed"
          : `Dollar rate saved: 1 USD = ${inr.format(updated.usd_to_inr_rate)}`,
      )
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const message = error.response?.data?.message
      toast.error(
        (Array.isArray(message) ? message[0] : message) ??
          "Could not save the dollar rate",
      )
    },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (trimmed === "") {
      save.mutate(null)
      return
    }
    const rate = Number(trimmed)
    if (!RATE_PATTERN.test(trimmed) || rate <= 0 || rate > MAX_RATE) {
      toast.error(
        "Enter a rate above 0 and up to 1,000, with at most 4 decimal places",
      )
      return
    }
    save.mutate(rate)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dollar rate</CardTitle>
        <CardDescription>
          Rupees per US dollar for this sheet. Saving it does not change the
          imported rows or re-import the sheet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-2" onSubmit={submit}>
          <Label htmlFor="usd-inr-rate">USD to INR rate</Label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">1 USD =</span>
            <Input
              id="usd-inr-rate"
              className="h-9 w-32"
              inputMode="decimal"
              placeholder="e.g. 88.25"
              autoComplete="off"
              value={value}
              onChange={(event) => setDraft(event.target.value)}
            />
            <span className="text-sm text-muted-foreground">INR</span>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={
                save.isPending || draft === null || draft.trim() === saved
              }
            >
              {save.isPending ? "Saving…" : "Save rate"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {source.usd_to_inr_rate === null
              ? "Not set yet."
              : `Last changed ${formatDateTime(source.usd_to_inr_rate_updated_at)}. Empty the box and save to remove it.`}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
