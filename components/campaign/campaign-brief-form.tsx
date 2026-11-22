"use client"

import { useRef } from "react"
import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Loader2 } from "lucide-react"
import { useForm, type FieldErrors, type Resolver, Controller } from "react-hook-form"
import toast from "react-hot-toast"

import { CategoryMultiSelect } from "@/components/campaign/category-multi-select"
import { ContentPlacementSelectField } from "@/components/content-placement/content-placement-select-field"
import { RepeatableTextList } from "@/components/campaign/repeatable-text-list"
import { SkuTagInput } from "@/components/campaign/sku-tag-input"
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
  campaignQueryKey,
  campaignsQueryKeyRoot,
  createCampaign,
  updateCampaign,
} from "@/lib/api/campaign"
import type { Campaign } from "@/lib/campaign.types"
import {
  buildCampaignUpdateBody,
  formValuesToCreateBody,
} from "@/lib/campaign-form-mappers"
import {
  campaignBriefCreateSchema,
  campaignBriefEmptyValues,
  type CampaignBriefFormValues,
} from "@/lib/validation/campaign-brief-form"
import { SEARCH_INTENT_OPTIONS } from "@/lib/search-intent"

type CampaignBriefFormProps = {
  mode: "create" | "edit"
  campaignId?: string
  defaultValues?: Partial<CampaignBriefFormValues>
  /** Snapshot at open — used to build a partial PUT body in edit mode. */
  initialSnapshot?: CampaignBriefFormValues
  onSuccess?: (campaign: Campaign) => void
  onCancel?: () => void
}

function flattenArrayError(err: unknown): string | undefined {
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: string }).message)
  }
  return undefined
}

function getApiErrorMessage(error: AxiosError<{ message?: string | string[] }>) {
  const msg = error.response?.data?.message
  if (Array.isArray(msg)) return msg.join(", ")
  if (typeof msg === "string" && msg.trim()) return msg
  return undefined
}

function getFirstFormError(
  errors: FieldErrors<CampaignBriefFormValues>,
): string | undefined {
  if (errors.root?.message) return String(errors.root.message)

  for (const key of Object.keys(errors) as (keyof CampaignBriefFormValues)[]) {
    const err = errors[key]
    if (!err) continue
    const direct = flattenArrayError(err)
    if (direct) return direct
    if (err && typeof err === "object" && "root" in err) {
      const rootMsg = flattenArrayError(
        (err as { root?: { message?: string } }).root,
      )
      if (rootMsg) return rootMsg
    }
  }
  return undefined
}

export function CampaignBriefForm({
  mode,
  campaignId,
  defaultValues,
  initialSnapshot,
  onSuccess,
  onCancel,
}: CampaignBriefFormProps) {
  const queryClient = useQueryClient()
  const submitForReviewRef = useRef(false)
  const mergedDefaults: CampaignBriefFormValues = {
    ...campaignBriefEmptyValues,
    ...defaultValues,
  }

  const saveMutation = useMutation({
    mutationFn: async (values: CampaignBriefFormValues) => {
      if (mode === "create") {
        return createCampaign(formValuesToCreateBody(values))
      }
      if (!campaignId || !initialSnapshot) {
        throw new Error("Missing campaign context")
      }
      const patch = buildCampaignUpdateBody(values, initialSnapshot)
      if (Object.keys(patch).length === 0) {
        toast.error("No changes to save")
        return null
      }
      return updateCampaign(campaignId, patch)
    },
    onSuccess: (result) => {
      if (!result) return
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeyRoot })
      queryClient.invalidateQueries({ queryKey: campaignQueryKey(result.id) })
      const submitted = submitForReviewRef.current
      toast.success(
        mode === "create"
          ? submitted
            ? "Campaign submitted for review"
            : "Campaign saved as draft"
          : "Campaign updated",
      )
      onSuccess?.(result)
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      toast.error(
        getApiErrorMessage(error) ??
          (mode === "create"
            ? "Could not create campaign"
            : "Could not update campaign"),
      )
    },
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CampaignBriefFormValues>({
    defaultValues: mergedDefaults,
    resolver: yupResolver(
      campaignBriefCreateSchema,
    ) as Resolver<CampaignBriefFormValues>,
    mode: "onTouched",
    shouldFocusError: true,
  })

  async function onValidSubmit(
    values: CampaignBriefFormValues,
    submitForReview: boolean,
  ) {
    submitForReviewRef.current = submitForReview
    const payload: CampaignBriefFormValues =
      mode === "create" ? { ...values, submit_for_review: submitForReview } : values
    try {
      await saveMutation.mutateAsync(payload)
    } catch {
      // Mutation onError shows toast.
    }
  }

  function onInvalidSubmit(errors: FieldErrors<CampaignBriefFormValues>) {
    const message =
      getFirstFormError(errors) ??
      "Please fix the highlighted fields before continuing."
    toast.error(message)
  }

  function runSubmit(submitForReview: boolean) {
    submitForReviewRef.current = submitForReview
    void handleSubmit(
      (values) => onValidSubmit(values, submitForReview),
      onInvalidSubmit,
    )()
  }

  const pending = isSubmitting || saveMutation.isPending

  const categoryError =
    flattenArrayError(errors.target_category) ??
    errors.target_category?.message ??
    errors.target_category?.root?.message

  const skuError =
    flattenArrayError(errors.product_skus) ??
    errors.product_skus?.message ??
    errors.product_skus?.root?.message

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-500 w-full max-w-3xl"
    >
      <div className="grid w-full gap-6">
        <div className="grid gap-2">
          <Label htmlFor="campaign-name">Campaign name</Label>
          <Input
            id="campaign-name"
            placeholder="e.g. Summer Skincare Push"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
          />
          {errors.name?.message ? (
            <p className="text-destructive text-xs font-medium" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <Controller
          name="target_category"
          control={control}
          render={({ field }) => (
            <CategoryMultiSelect
              value={field.value}
              onChange={field.onChange}
              error={categoryError}
              disabled={pending}
            />
          )}
        />

        <div className="grid gap-2">
          <Label htmlFor="target-market">Target market</Label>
          <Input
            id="target-market"
            placeholder="e.g. US"
            aria-invalid={errors.target_market ? true : undefined}
            {...register("target_market")}
          />
          {errors.target_market?.message ? (
            <p className="text-destructive text-xs font-medium" role="alert">
              {errors.target_market.message}
            </p>
          ) : null}
        </div>

        <Controller
          name="product_skus"
          control={control}
          render={({ field }) => (
            <SkuTagInput
              value={field.value}
              onChange={field.onChange}
              error={skuError}
              disabled={pending}
            />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="budget-min">Budget minimum (USD)</Label>
            <Input
              id="budget-min"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              aria-invalid={errors.budget_min ? true : undefined}
              {...register("budget_min")}
            />
            {errors.budget_min?.message ? (
              <p className="text-destructive text-xs font-medium" role="alert">
                {errors.budget_min.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget-max">Budget maximum (USD)</Label>
            <Input
              id="budget-max"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              aria-invalid={errors.budget_max ? true : undefined}
              {...register("budget_max")}
            />
            {errors.budget_max?.message ? (
              <p className="text-destructive text-xs font-medium" role="alert">
                {errors.budget_max.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="gmv-target">GMV target (optional)</Label>
            <Input
              id="gmv-target"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              aria-invalid={errors.gmv_target ? true : undefined}
              {...register("gmv_target")}
            />
            {errors.gmv_target?.message ? (
              <p className="text-destructive text-xs font-medium" role="alert">
                {errors.gmv_target.message}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Provide GMV and/or ROI target below.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="roi-target">ROI target (optional)</Label>
            <Input
              id="roi-target"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-invalid={errors.roi_target ? true : undefined}
              {...register("roi_target")}
            />
            {errors.roi_target?.message ? (
              <p className="text-destructive text-xs font-medium" role="alert">
                {errors.roi_target.message}
              </p>
            ) : null}
          </div>
        </div>
        {errors.root?.message ? (
          <p className="text-destructive text-xs font-medium" role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <div className="w-full min-w-0">
          <RepeatableTextList
            control={control}
            register={register}
            name="commerce_links"
            label="Commerce links"
            addButtonLabel="Add link"
            placeholder="https://…"
            fullWidthRows
            error={
              flattenArrayError(errors.commerce_links) ??
              errors.commerce_links?.root?.message
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Notes (optional)</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Timing, creative direction, constraints…"
            aria-invalid={errors.description ? true : undefined}
            {...register("description")}
            className="w-full min-w-0"
          />
        </div>

        <Controller
          name="content_placement_id"
          control={control}
          render={({ field }) => (
            <ContentPlacementSelectField
              value={field.value}
              onChange={field.onChange}
              disabled={pending}
              error={errors.content_placement_id?.message}
            />
          )}
        />

        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
          <div>
            <p className="text-sm font-medium">AEO optimization</p>
            <p className="text-muted-foreground text-xs">
              Keywords and search intent for answer engine optimization.
            </p>
          </div>

          <Controller
            name="primary_keywords"
            control={control}
            render={({ field }) => (
              <SkuTagInput
                value={field.value}
                onChange={field.onChange}
                label="Primary keywords"
                placeholder="Type a keyword and press Enter"
                disabled={pending}
              />
            )}
          />

          <Controller
            name="secondary_keywords"
            control={control}
            render={({ field }) => (
              <SkuTagInput
                value={field.value}
                onChange={field.onChange}
                label="Secondary keywords"
                placeholder="Type a keyword and press Enter"
                disabled={pending}
              />
            )}
          />

          <Controller
            name="search_intent"
            control={control}
            render={({ field }) => (
              <div className="grid gap-2">
                <Label>Search intent</Label>
                <Select
                  value={field.value || "none"}
                  onValueChange={(v) =>
                    field.onChange(v === "none" ? "" : v)
                  }
                  disabled={pending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intent (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {SEARCH_INTENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {mode === "create" ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                className="min-w-36"
                onClick={() => runSubmit(false)}
              >
                {pending && !submitForReviewRef.current ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save draft"
                )}
              </Button>
              <Button
                type="button"
                disabled={pending}
                className="min-w-36"
                onClick={() => runSubmit(true)}
              >
                {pending && submitForReviewRef.current ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  "Submit for review"
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={pending}
              onClick={() => runSubmit(false)}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          )}
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  )
}
