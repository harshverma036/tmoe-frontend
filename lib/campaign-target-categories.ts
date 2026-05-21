/**
 * Target categories for campaign briefs (multi-select in the brand form).
 * Extend this list as your catalog grows.
 */
export const CAMPAIGN_TARGET_CATEGORY_OPTIONS = [
  "Skincare",
  "Makeup",
  "Hair care",
  "Fragrance",
  "Body care",
  "Wellness",
  "Fashion",
  "Footwear",
  "Accessories",
  "Jewelry",
  "Home & living",
  "Electronics",
  "Food & beverage",
  "Sports & outdoors",
  "Baby & kids",
  "Pet care",
] as const

export type CampaignTargetCategoryOption =
  (typeof CAMPAIGN_TARGET_CATEGORY_OPTIONS)[number]

export function mergeCategoryOptionsWithSelection(
  selected: string[],
): string[] {
  const set = new Set<string>([...CAMPAIGN_TARGET_CATEGORY_OPTIONS, ...selected])
  return [...set].sort((a, b) => a.localeCompare(b))
}
