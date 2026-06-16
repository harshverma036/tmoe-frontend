"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { ArrowRight, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

import { PublisherMultiSelect } from "@/components/campaign/publisher-multi-select"
import { RoiEstimatorWidget } from "@/components/campaign/roi-estimator-widget"
import {
  WizardFooterNav,
  WizardShell,
  WizardStepHeader,
  type WizardStep,
} from "@/components/common/wizard-shell"
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
import { Textarea } from "@/components/ui/textarea"
import {
  assignPublishers,
  convertFromBrief,
  createAdminCampaign,
  estimateCampaign,
} from "@/lib/api/campaign"
import type { Campaign } from "@/lib/campaign.types"
import { fetchPublishersForAssignment } from "@/lib/api/publisher-search"
import { fetchRoiBenchmarks } from "@/lib/api/roi-benchmarks"
import apiConfig from "@/lib/apiConfig"

type BrandOption = { id: string; brand_name: string }

type Props = {
  /** When set, wizard converts an approved brief instead of creating from scratch. */
  brief?: Campaign
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "basics",
    label: "Campaign basics",
    description: "Brand, market, and product details",
  },
  {
    id: "publishers",
    label: "Publisher selection",
    description: "Assign publisher partners",
  },
  {
    id: "budget",
    label: "Budget & timeline",
    description: "Spend split and campaign dates",
  },
  {
    id: "roi",
    label: "ROI estimation",
    description: "Projected performance",
  },
  {
    id: "review",
    label: "Review & publish",
    description: "Confirm details and save",
  },
]

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
  const [roiCategory, setRoiCategory] = useState("")
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)

  const { data: roiBenchmarks = [] } = useQuery({
    queryKey: ["roi-benchmarks"],
    queryFn: fetchRoiBenchmarks,
  })

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

  useEffect(() => {
    if (!roiBenchmarks.length || roiCategory) return
    const hint =
      brief?.target_category[0]?.trim() ||
      splitLines(targetCategory.replace(/,/g, "\n"))[0]
    const match = hint
      ? roiBenchmarks.find(
          (b) => b.category.toLowerCase() === hint.toLowerCase(),
        )
      : undefined
    setRoiCategory(match?.category ?? roiBenchmarks[0].category)
  }, [roiBenchmarks, roiCategory, brief?.target_category, targetCategory])

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
      if (roiBenchmarks.length > 0 && !roiCategory.trim()) {
        throw new Error(
          "Select an ROI benchmark category on the ROI estimation step before saving.",
        )
      }

      let campaign: Campaign
      if (brief) {
        campaign = await convertFromBrief(brief.id, {
          content_budget: payload.content_budget,
          distribution_budget: payload.distribution_budget,
          content_type: payload.content_type,
          start_date: payload.start_date,
          end_date: payload.end_date,
          publisher_ids: payload.publisher_ids,
        })
      } else {
        campaign = await createAdminCampaign(payload)
      }

      if (selectedPublishers.length && !brief) {
        await assignPublishers(campaign.id, selectedPublishers)
      }

      if (roiCategory.trim()) {
        const estimateBody: Parameters<typeof estimateCampaign>[1] = {
          content_budget: payload.content_budget,
          distribution_budget: payload.distribution_budget,
          category: roiCategory.trim(),
        }
        if (selectedPublishers.length > 0) {
          estimateBody.publisher_ids = selectedPublishers
        }
        await estimateCampaign(campaign.id, estimateBody)
      }

      return campaign
    },
    onSuccess: (campaign) => {
      setCreatedCampaignId(campaign.id)
      toast.success("Campaign saved as draft")
      router.push(`/campaign/${campaign.id}`)
    },
    onError: (error: unknown) => {
      let message = "Could not save campaign"
      if (error instanceof AxiosError) {
        message = error.response?.data?.message ?? message
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
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
    if (step >= 3 && roiBenchmarks.length > 0) {
      return Boolean(roiCategory.trim())
    }
    return true
  }

  const isLastStep = step === WIZARD_STEPS.length - 1
  const currentStepMeta = WIZARD_STEPS[step]
  const previousStepMeta = step > 0 ? WIZARD_STEPS[step - 1] : null
  const nextStepMeta = !isLastStep ? WIZARD_STEPS[step + 1] : null

  const pageTitle = brief ? "Convert brief to campaign" : "Create campaign"
  const stepSubtitle = `Step ${step + 1} of ${WIZARD_STEPS.length} · ${currentStepMeta.label}`

  const renderSaveDraftButton = () => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 rounded-xl px-4 shadow-none"
      disabled={!isLastStep || saveMutation.isPending || !canNext()}
      onClick={() => saveMutation.mutate()}
    >
      {saveMutation.isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Saving…
        </>
      ) : (
        "Save draft"
      )}
    </Button>
  )

  const continueButton = (
    <Button
      type="button"
      size="sm"
      className="h-9 gap-1.5 rounded-xl px-4 shadow-none"
      disabled={!canNext() || saveMutation.isPending}
      onClick={() => {
        if (isLastStep) {
          saveMutation.mutate()
          return
        }
        setStep((current) => current + 1)
      }}
    >
      {isLastStep ? (
        brief ? "Convert to campaign" : "Create campaign (Draft)"
      ) : (
        <>
          Continue
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  )

  return (
    <WizardShell
      breadcrumbs={
        <>
          TMOE Admin <span className="mx-1.5">/</span>{" "}
          {brief ? "Convert Brief" : "Create Campaign"}
        </>
      }
      title={pageTitle}
      stepSubtitle={stepSubtitle}
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      headerActions={
        <>
          {renderSaveDraftButton()}
          {continueButton}
        </>
      }
      footer={
        <WizardFooterNav
          backLabel={previousStepMeta?.label}
          onBack={() => setStep((current) => Math.max(0, current - 1))}
          backDisabled={step === 0}
          secondaryAction={renderSaveDraftButton()}
          primaryAction={
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 rounded-xl px-4 shadow-none"
              disabled={!canNext() || saveMutation.isPending}
              onClick={() => {
                if (isLastStep) {
                  saveMutation.mutate()
                  return
                }
                setStep((current) => current + 1)
              }}
            >
              {isLastStep ? (
                brief ? "Convert to campaign" : "Create campaign (Draft)"
              ) : (
                <>
                  Continue to {nextStepMeta?.label}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          }
        />
      }
    >
      {step === 0 ? (
        <>
          <WizardStepHeader
            stepNumber={1}
            title="Campaign basics"
            description="Set the brand, campaign name, categories, and commerce details."
          />
          <div className="space-y-4">
            {!brief ? (
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger className="h-10 rounded-xl border-border/80 bg-muted/20 shadow-none">
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
              <p className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Converting brief for{" "}
                <span className="font-medium text-foreground">
                  {brief.brand_profile?.brand_name}
                </span>
              </p>
            )}
            <div className="space-y-2">
              <Label>Campaign name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Categories (comma or newline)</Label>
              <Textarea
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                rows={2}
                className="rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Target market</Label>
              <Input
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Product SKUs (one per line)</Label>
              <Textarea
                value={productSkus}
                onChange={(e) => setProductSkus(e.target.value)}
                rows={3}
                className="rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Commerce links (one per line)</Label>
              <Textarea
                value={commerceLinks}
                onChange={(e) => setCommerceLinks(e.target.value)}
                rows={3}
                className="rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Content type</Label>
              <Input
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
          </div>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <WizardStepHeader
            stepNumber={2}
            title="Publisher selection"
            description="Search and assign publishers to this campaign."
          />
          <PublisherMultiSelect
            publishers={publisherResults?.items ?? []}
            value={selectedPublishers}
            onChange={setSelectedPublishers}
            search={publisherSearch}
            onSearchChange={setPublisherSearch}
            isLoading={publishersLoading}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <WizardStepHeader
            stepNumber={3}
            title="Budget & timeline"
            description="Split spend between content and distribution, then set dates."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Content budget (USD)</Label>
              <Input
                type="number"
                min={0}
                value={contentBudget}
                onChange={(e) => setContentBudget(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Distribution budget (USD)</Label>
              <Input
                type="number"
                min={0}
                value={distBudget}
                onChange={(e) => setDistBudget(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-muted/20 shadow-none"
              />
            </div>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <WizardStepHeader
            stepNumber={4}
            title="ROI estimation"
            description="Pick a benchmark category for projected traffic, orders, and return."
          />
          <RoiEstimatorWidget
            campaignId={createdCampaignId ?? brief?.id}
            defaultBody={{
              content_budget: Number(contentBudget) || 0,
              distribution_budget: Number(distBudget) || 0,
              category: roiCategory || undefined,
              ...(selectedPublishers.length > 0
                ? { publisher_ids: selectedPublishers }
                : {}),
            }}
            onCategoryChange={setRoiCategory}
          />
        </>
      ) : null}

      {step === 4 ? (
        <>
          <WizardStepHeader
            stepNumber={5}
            title="Review & publish"
            description="Confirm campaign details before saving as a draft."
          />
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/15 p-4 text-sm">
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
            {roiCategory ? (
              <p>
                <span className="text-muted-foreground">ROI benchmark:</span>{" "}
                {roiCategory}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </WizardShell>
  )
}
