"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { estimateCampaign } from "@/lib/api/campaign"
import { fetchRoiBenchmarks } from "@/lib/api/roi-benchmarks"
import type { EstimateCampaignBody, RoiEstimate } from "@/lib/campaign.types"

type Props = {
  /** Omit before the campaign exists; category selection still works. */
  campaignId?: string
  defaultBody: EstimateCampaignBody
  onEstimated?: (estimate: RoiEstimate) => void
  onCategoryChange?: (category: string) => void
}

function buildEstimateBody(
  base: EstimateCampaignBody,
  category: string,
): EstimateCampaignBody {
  const body: EstimateCampaignBody = {
    content_budget: base.content_budget,
    distribution_budget: base.distribution_budget,
    category: category.trim(),
  }
  if (base.publisher_ids && base.publisher_ids.length > 0) {
    body.publisher_ids = base.publisher_ids
  }
  return body
}

export function RoiEstimatorWidget({
  campaignId,
  defaultBody,
  onEstimated,
  onCategoryChange,
}: Props) {
  const [estimate, setEstimate] = useState<RoiEstimate | null>(null)

  const { data: benchmarks = [], isLoading: benchmarksLoading } = useQuery({
    queryKey: ["roi-benchmarks"],
    queryFn: fetchRoiBenchmarks,
  })

  const [roiCategory, setRoiCategory] = useState("")

  useEffect(() => {
    if (!benchmarks.length) return
    setRoiCategory((current) => {
      if (current) return current
      const hint = defaultBody.category?.trim()
      const match = hint
        ? benchmarks.find(
            (b) => b.category.toLowerCase() === hint.toLowerCase(),
          )
        : undefined
      const next = match?.category ?? benchmarks[0]?.category ?? ""
      onCategoryChange?.(next)
      return next
    })
  }, [benchmarks, defaultBody.category, onCategoryChange])

  function handleCategoryChange(value: string) {
    setRoiCategory(value)
    onCategoryChange?.(value)
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!campaignId) {
        throw new Error("Save the campaign first to calculate ROI")
      }
      return estimateCampaign(
        campaignId,
        buildEstimateBody(defaultBody, roiCategory),
      )
    },
    onSuccess: (data) => {
      setEstimate(data)
      onEstimated?.(data)
      toast.success("ROI estimate calculated")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ??
          "Could not calculate ROI — pick a category that exists under ROI Benchmarks",
      )
    },
  })

  const metrics = estimate
    ? [
        { label: "Est. traffic", value: estimate.est_traffic.toLocaleString() },
        { label: "Est. clicks", value: estimate.est_clicks.toLocaleString() },
        { label: "Est. orders", value: estimate.est_orders.toLocaleString() },
        { label: "Est. GMV", value: `$${estimate.est_gmv.toLocaleString()}` },
        {
          label: "Est. ROI",
          value: `${(estimate.est_roi * 100).toFixed(1)}%`,
        },
      ]
    : []

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Estimated values — subject to change. Use a category that matches an entry
        on the ROI Benchmarks screen.
      </p>

      <div className="space-y-2">
        <Label>ROI category (benchmark)</Label>
        {benchmarksLoading ? (
          <p className="text-muted-foreground text-xs">Loading categories…</p>
        ) : benchmarks.length === 0 ? (
          <p className="text-destructive text-xs">
            No ROI benchmarks configured. Add at least one under ROI Benchmarks.
          </p>
        ) : (
          <Select value={roiCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select benchmark category" />
            </SelectTrigger>
            <SelectContent>
              {benchmarks.map((b) => (
                <SelectItem key={b.id} value={b.category}>
                  {b.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={
          mutation.isPending ||
          !campaignId ||
          !roiCategory ||
          benchmarks.length === 0
        }
      >
        {mutation.isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        ) : null}
        Calculate ROI
      </Button>
      {!campaignId && benchmarks.length > 0 ? (
        <p className="text-muted-foreground text-xs">
          Save the campaign as draft to run the calculation, or estimates will
          run automatically when you save.
        </p>
      ) : null}
      {metrics.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <Card key={m.label} size="sm">
              <CardHeader className="pb-1">
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xl font-semibold tabular-nums">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
