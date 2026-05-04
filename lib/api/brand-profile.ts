import apiConfig from "@/lib/apiConfig"

import type { BrandFormValues } from "@/lib/types/brand-profile"

/** Payload for POST /api/users/complete-profile/brand */
export type CompleteBrandProfileRequest = {
  brand_name: string
  description?: string
  industry?: string
  headquarters_location?: string
  product_categories: string[]
  target_market_geo: string[]
  commerce_links: string[]
}

export const COMPLETE_BRAND_PROFILE_PATH =
  "/api/users/complete-profile/brand"

export function mapBrandFormToApiPayload(
  values: BrandFormValues,
): CompleteBrandProfileRequest {
  const commerce_links = values.commerce_links
    .map((row) => row.url.trim())
    .filter(Boolean)

  const payload: CompleteBrandProfileRequest = {
    brand_name: values.brand_name.trim(),
    product_categories: values.product_categories,
    target_market_geo: values.target_market_geo,
    commerce_links,
  }

  const description = values.description?.trim()
  if (description) payload.description = description

  const industry = values.industry?.trim()
  if (industry) payload.industry = industry

  const hq = values.headquarters_location?.trim()
  if (hq) payload.headquarters_location = hq

  return payload
}

export async function completeBrandProfile(
  body: CompleteBrandProfileRequest,
): Promise<unknown> {
  const { data } = await apiConfig.post<unknown>(
    COMPLETE_BRAND_PROFILE_PATH,
    body,
  )
  return data
}
