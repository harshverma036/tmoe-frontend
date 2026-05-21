/** Mirrors backend `CAMPAIGN_STATUS` (Prisma). */
export type CampaignStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"

/** Normalized campaign row used in the dashboard UI. */
export type Campaign = {
  id: string
  name: string
  target_category: string[]
  target_market: string
  product_skus: string[]
  budget_min: number
  budget_max: number
  gmv_target?: number | null
  roi_target?: number | null
  commerce_links: string[]
  description?: string | null
  status: CampaignStatus
  created_at?: string | null
  updated_at?: string | null
}

export type CampaignListResult = {
  items: Campaign[]
  total: number
}

export type CreateCampaignBody = {
  name: string
  target_category: string[]
  target_market: string
  product_skus: string[]
  budget_min: number
  budget_max: number
  commerce_links: string[]
  gmv_target?: number
  roi_target?: number
  submit_for_review?: boolean
  description?: string
}

export type UpdateCampaignBody = Partial<CreateCampaignBody>
