/**
 * Shared types for the brand onboarding form and the complete-profile API.
 */

export type BrandFormValues = {
  brand_name: string
  description?: string
  industry?: string
  headquarters_location?: string
  product_categories: string[]
  target_market_geo: string[]
  commerce_links: { url: string }[]
}
