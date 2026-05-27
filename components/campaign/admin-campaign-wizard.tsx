"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import toast from "react-hot-toast"

import { PublisherMultiSelect } from "@/components/campaign/publisher-multi-select"
import { RoiEstimatorWidget } from "@/components/campaign/roi-estimator-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  assignPublishers,
  convertFromBrief,
  createAdminCampaign,
  estimateCampaign,
} from "@/lib/api/campaign"
import type { Campaign } from "@/lib/campaign.types"
import { fetchPublishersForAssignment } from "@/lib/api/publisher-search"
import apiConfig from "@/lib/apiConfig"

type BrandOption = { id: string; brand_name: string }

type Props = {
  /** When set, wizard converts an approved brief instead of creating from scratch. */
  brief?: Campaign
}

const STEPS = ["Basics", "Publishers", "Budget", "ROI", "Review"] as const

export function AdminCampaignWizard({ brief }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [brandId, setBrandId] = useState(brief?.brand_profile?.id ?? "")
  const [name, setName] = useState(brief?.name ?? "")
  const [targetMarket, setTargetMarket] = useState(brief?.target_market ?? "")
  const [targetCategory, setTargetCategory] = useState(
    brief?.target_category.join(", ") ?? "",
  )
  const [productSkus, setProductSkus] = useState(brief?.product_skus.join("\n") ?? "")
  const [commerceLinks, setCommerceLinks] = useState(
    brief?.commerce_links.join("\n") ?? "",
  )
  const [contentType, setContentType] = useState("Editorial")
  const [contentBudget, setContentBudget] = useState(
    String(brief?.budget_min ? Math.floor(brief.budget_min * 0.6) : ""),
  )
  const [distBudget, setDistBudget] = useState(
    String(brief?.budget_max ? Math.floor(brief.budget_max * 0.4) : ""),
  )
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [publisherSearch, setPublisherSearch] = useState("")
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([])
  const [roiCategory, setRoiCategory] = useState(brief?.target_category[0] ?? "")
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-for-campaign"],
    queryFn: async () => {
      const { data } = await apiConfig.get("/api/brand/list")
      const root = data as Record<string, unknown>
      const rows = root.data ?? root
      if (!Array.isArray(rows)) return [] as BrandOption[]
      return rows.map((r) => {
        const row = r as Record<string, unknown>
        return {
          id: String(row.id ?? ""),
          brand_name: String(row.brand_name ?? row.brandName ?? ""),
        }
      })
    },
  })

  const { data: publisherResults, isLoading: publishersLoading } = useQuery({
    queryKey: ["publisher-list", publisherSearch],
    queryFn: () =>
      fetchPublishersForAssignment({
        search: publisherSearch || undefined,
        limit: 200,
      }),
    enabled: step === 1,
  })

  const splitLines = (text: string) =>
    text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

  const payload = useMemo(
    () => ({
      brand_profile_id: brandId,
      name: name.trim(),
      target_category: splitLines(targetCategory.replace(/,/g, "\n")),
      target_market: targetMarket.trim(),
      product_skus: splitLines(productSkus),
      commerce_links: splitLines(commerceLinks),
      content_budget: Number(contentBudget) || 0,
      distribution_budget: Number(distBudget) || 0,
      content_type: contentType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      publisher_ids: selectedPublishers,
    }),
    [
      brandId,
      name,
      targetCategory,
      targetMarket,
      productSkus,
      commerceLinks,
      contentBudget,
      distBudget,
      contentType,
      startDate,
      endDate,
      selectedPublishers,
    ],
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (brief) {
        return convertFromBrief(brief.id, {
          content_budget: payload.content_budget,
          distribution_budget: payload.distribution_budget,
          content_type: payload.content_type,
          start_date: payload.start_date,
          end_date: payload.end_date,
          publisher_ids: payload.publisher_ids,
        })
      }
      return createAdminCampaign(payload)
    },
    onSuccess: async (campaign) => {
      setCreatedCampaignId(campaign.id)
      if (selectedPublishers.length && !brief) {
        await assignPublishers(campaign.id, selectedPublishers)
      }
      const estimateBody: Parameters<typeof estimateCampaign>[1] = {
        content_budget: payload.content_budget,
        distribution_budget: payload.distribution_budget,
        category: roiCategory || payload.target_category[0],
      }
      if (selectedPublishers.length > 0) {
        estimateBody.publisher_ids = selectedPublishers
      }
      await estimateCampaign(campaign.id, estimateBody)
      toast.success("Campaign saved as draft")
      router.push(`/campaign/${campaign.id}`)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not save campaign")
    },
  })

  const canNext = () => {
    if (step === 0) {
      return (
        (brief || brandId) &&
        name.trim() &&
        targetMarket.trim() &&
        splitLines(targetCategory.replace(/,/g, "\n")).length > 0
      )
    }
    if (step === 2) {
      return Number(contentBudget) > 0 && Number(distBudget) > 0
    }
    return true
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <Button
            key={label}
            type="button"
            size="sm"
            variant={step === i ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setStep(i)}
          >
            {i + 1}. {label}
          </Button>
        ))}
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Campaign basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!brief ? (
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.brand_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Converting brief for{" "}
                <span className="font-medium text-foreground">
                  {brief.brand_profile?.brand_name}
                </span>
              </p>
            )}
            <div className="space-y-2">
              <Label>Campaign name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Categories (comma or newline)</Label>
              <Textarea
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Target market</Label>
              <Input
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Product SKUs (one per line)</Label>
              <Textarea
                value={productSkus}
                onChange={(e) => setProductSkus(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Commerce links (one per line)</Label>
              <Textarea
                value={commerceLinks}
                onChange={(e) => setCommerceLinks(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Content type</Label>
              <Input
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Publisher selection</CardTitle>
          </CardHeader>
          <CardContent>
            <PublisherMultiSelect
              publishers={publisherResults?.items ?? []}
              value={selectedPublishers}
              onChange={setSelectedPublishers}
              search={publisherSearch}
              onSearchChange={setPublisherSearch}
              isLoading={publishersLoading}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Budget breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Content budget (USD)</Label>
              <Input
                type="number"
                min={0}
                value={contentBudget}
                onChange={(e) => setContentBudget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Distribution budget (USD)</Label>
              <Input
                type="number"
                min={0}
                value={distBudget}
                onChange={(e) => setDistBudget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 && (createdCampaignId || brief?.id) ? (
        <Card>
          <CardHeader>
            <CardTitle>ROI estimation</CardTitle>
          </CardHeader>
          <CardContent>
            <RoiEstimatorWidget
              campaignId={createdCampaignId ?? brief!.id}
              defaultBody={{
                content_budget: Number(contentBudget) || 0,
                distribution_budget: Number(distBudget) || 0,
                category: splitLines(targetCategory.replace(/,/g, "\n"))[0],
                ...(selectedPublishers.length > 0
                  ? { publisher_ids: selectedPublishers }
                  : {}),
              }}
              onCategoryChange={setRoiCategory}
            />
          </CardContent>
        </Card>
      ) : step === 3 ? (
        <p className="text-muted-foreground text-sm">
          Save the campaign on the Review step to run ROI estimation.
        </p>
      ) : null}

      {step === 4 ? (
        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Name:</span> {name}
            </p>
            <p>
              <span className="text-muted-foreground">Market:</span>{" "}
              {targetMarket}
            </p>
            <p>
              <span className="text-muted-foreground">Budget:</span> $
              {contentBudget} content + ${distBudget} distribution
            </p>
            <p>
              <span className="text-muted-foreground">Publishers:</span>{" "}
              {selectedPublishers.length}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canNext()}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            disabled={saveMutation.isPending || !canNext()}
            onClick={() => saveMutation.mutate()}
          >
            {brief ? "Convert to campaign" : "Create campaign (Draft)"}
          </Button>
        )}
      </div>
    </div>
  )
}
