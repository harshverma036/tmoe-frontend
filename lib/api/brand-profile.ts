import apiConfig from "@/lib/apiConfig"

import type { BrandFormValues } from "@/lib/types/brand-profile"
import type {
  BrandProfileInformationFormValues,
  PersonalInformationValues,
} from "@/lib/validation/settings-forms"

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

// --- Brand account settings (distinct from publisher profile APIs) ---

/** GET `/api/brand/profile/me` — adjust path here if the backend route differs. */
export const BRAND_PROFILE_ME_PATH = "/api/brand/profile/me"

/** PUT `/api/brand/update-profile` */
export const BRAND_UPDATE_PROFILE_PATH = "/api/brand/update-profile"

export const brandProfileMeQueryKey = ["brand-profile", "me"] as const

/** TanStack Query mutation key for brand profile updates (settings form). */
export const brandProfileUpdateMutationKey = ["brand-profile", "update"] as const

/**
 * Body for PUT `/api/brand/update-profile`.
 *
 * @example
 * ```json
 * {
 *   "brand_name": "Acme Corp",
 *   "description": "Consumer goods and lifestyle products.",
 *   "industry": "Retail",
 *   "headquarters_location": "Mumbai, India",
 *   "product_categories": ["Apparel", "Home", "Beauty"],
 *   "target_market_geo": ["IN", "AE", "SG"],
 *   "commerce_links": [
 *     "https://example.com/shop",
 *     "https://marketplace.example.com/acme"
 *   ]
 * }
 * ```
 */
export type UpdateBrandProfilePayload = {
  brand_name?: string
  description?: string
  industry?: string
  headquarters_location?: string
  product_categories?: string[]
  target_market_geo?: string[]
  commerce_links?: string[]
}

export async function fetchBrandProfileMe(): Promise<any> {
  const { data } = await apiConfig.get<any>(BRAND_PROFILE_ME_PATH)
  return data.data
}

/** PUT {@link BRAND_UPDATE_PROFILE_PATH} with a {@link UpdateBrandProfilePayload} JSON body. */
export async function updateBrandProfile(
  body: UpdateBrandProfilePayload,
): Promise<unknown> {
  const { data } = await apiConfig.put<unknown>(BRAND_UPDATE_PROFILE_PATH, body)
  return data
}

export type BrandProfileSettingsInitials = {
  personal: PersonalInformationValues
  brand: BrandProfileInformationFormValues
}

/** Maps GET profile payload into settings form defaults (commerce_links string[] → field-array rows). */
export function mapBrandProfileToSettingsInitials(
  profile: any,
): BrandProfileSettingsInitials {
  const links: string[] = Array.isArray(profile.commerce_links)
    ? profile.commerce_links
    : []

  return {
    personal: {
      name: profile.user?.name ?? "",
      email: profile.user?.email ?? "",
    },
    brand: {
      brand_name: profile.brand_name ?? "",
      description: profile.description ?? "",
      industry: profile.industry ?? "",
      headquarters_location: profile.headquarters_location ?? "",
      product_categories: profile.product_categories ?? [],
      target_market_geo: profile.target_market_geo ?? [],
      commerce_links:
        links.length > 0 ? links.map((url) => ({ url })) : [{ url: "" }],
    },
  }
}

export function buildBrandProfileUpdatePayload(
  data: BrandProfileInformationFormValues,
): UpdateBrandProfilePayload {
  const payload: UpdateBrandProfilePayload = {}

  const brandName = data.brand_name?.trim()
  if (brandName) payload.brand_name = brandName

  const description = data.description?.trim()
  if (description) payload.description = description

  const industry = data.industry?.trim()
  if (industry) payload.industry = industry

  const hq = data.headquarters_location?.trim()
  if (hq) payload.headquarters_location = hq

  payload.product_categories = [...(data.product_categories ?? [])]
  payload.target_market_geo = [...(data.target_market_geo ?? [])]

  const commerce_links =
    data.commerce_links
      ?.map((row) => row.url?.trim())
      .filter((u): u is string => Boolean(u)) ?? []
  payload.commerce_links = commerce_links

  return payload
}

