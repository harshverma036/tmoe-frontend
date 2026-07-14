import { isEqual } from "lodash"

import type {
  Campaign,
  CreateCampaignBody,
  UpdateCampaignBody,
} from "@/lib/campaign.types"
import type { CampaignBriefFormValues } from "@/lib/validation/campaign-brief-form"

export function campaignToFormValues(c: Campaign): CampaignBriefFormValues {
  return {
    name: c.name,
    target_category: c.target_category.length ? [...c.target_category] : [],
    target_market: c.target_market,
    product_skus: c.product_skus.length ? [...c.product_skus] : [],
    budget_min: c.budget_min,
    budget_max: c.budget_max,
    gmv_target: c.gmv_target ?? undefined,
    roi_target: c.roi_target ?? undefined,
    commerce_links: c.commerce_links.length ? [...c.commerce_links] : [""],
    submit_for_review: false,
    description: c.description ?? "",
    primary_keywords: c.primary_keywords?.length ? [...c.primary_keywords] : [],
    secondary_keywords: c.secondary_keywords?.length
      ? [...c.secondary_keywords]
      : [],
    search_intent: c.search_intent ?? "",
    content_placement_id: c.content_placement_id ?? "",
  }
}

export function formValuesToCreateBody(
  v: CampaignBriefFormValues,
): CreateCampaignBody {
  const body: CreateCampaignBody = {
    name: v.name.trim(),
    target_category: v.target_category.map((s) => s.trim()).filter(Boolean),
    target_market: v.target_market.trim(),
    product_skus: v.product_skus.map((s) => s.trim()).filter(Boolean),
    budget_min: Math.round(Number(v.budget_min)),
    budget_max: Math.round(Number(v.budget_max)),
    commerce_links: v.commerce_links.map((s) => s.trim()).filter(Boolean),
    submit_for_review: v.submit_for_review,
  }
  if (v.gmv_target != null && !Number.isNaN(Number(v.gmv_target))) {
    body.gmv_target = Math.round(Number(v.gmv_target))
  }
  if (v.roi_target != null && !Number.isNaN(Number(v.roi_target))) {
    body.roi_target = Number(v.roi_target)
  }
  const d = v.description?.trim()
  if (d) body.description = d
  if (v.primary_keywords?.length) {
    body.primary_keywords = v.primary_keywords.map((s) => s.trim()).filter(Boolean)
  }
  if (v.secondary_keywords?.length) {
    body.secondary_keywords = v.secondary_keywords
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const intent = v.search_intent?.trim()
  if (intent) body.search_intent = intent as CreateCampaignBody["search_intent"]
  const placementId = v.content_placement_id?.trim()
  if (placementId) body.content_placement_id = placementId
  return body
}

const FORM_KEYS: (keyof CampaignBriefFormValues)[] = [
  "name",
  "target_category",
  "target_market",
  "product_skus",
  "budget_min",
  "budget_max",
  "gmv_target",
  "roi_target",
  "commerce_links",
  "submit_for_review",
  "description",
  "primary_keywords",
  "secondary_keywords",
  "search_intent",
  "content_placement_id",
]

export function buildCampaignUpdateBody(
  next: CampaignBriefFormValues,
  initial: CampaignBriefFormValues,
): UpdateCampaignBody {
  const patch: UpdateCampaignBody = {}
  for (const key of FORM_KEYS) {
    if (!isEqual(next[key], initial[key])) {
      const val = next[key]
      if (key === "description") {
        ;(patch as Record<string, unknown>)[key] = String(val ?? "").trim()
        continue
      }
      if (key === "search_intent") {
        const intent = String(val ?? "").trim()
        ;(patch as Record<string, unknown>)[key] = intent || null
        continue
      }
      if (key === "content_placement_id") {
        const placementId = String(val ?? "").trim()
        ;(patch as Record<string, unknown>)[key] = placementId || null
        continue
      }
      ;(patch as Record<string, unknown>)[key] = val
    }
  }
  return patch
}
