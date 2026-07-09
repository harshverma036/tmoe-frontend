import type { ContentPlacement } from "@/lib/content-placement.types"

/** Brief + operational campaign statuses (Prisma `CAMPAIGN_STATUS`). */
export type CampaignStatus =  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"

export type SearchIntent =
  | "INFORMATIONAL"
  | "COMMERCIAL"
  | "TRANSACTIONAL"
  | "NAVIGATIONAL"

export type CampaignApplicationStatus = "PENDING" | "APPROVED" | "REJECTED"

export type CampaignApplication = {
  id: string
  campaign_id?: string
  publisher_profile_id?: string
  status: CampaignApplicationStatus
  note?: string | null
  rejection_note?: string | null
  reviewed_at?: string | null
  created_at?: string | null
  publisher_profile?: {
    id: string
    publication_name?: string | null
    content_categories?: string[]
    monthly_sessions?: number | null
    user?: { id: string; name?: string | null; email: string }
  }
  reviewed_by?: { id: string; name?: string | null; email: string } | null
}

export type CampaignPublisherAssignment = {
  id: string
  publisher_profile_id: string
  assigned_at?: string | null
  accepted_at?: string | null
  publisher_profile?: {
    id: string
    publication_name?: string | null
    monthly_sessions?: number | null
    user?: { id: string; name?: string | null; email: string }
  }
}

export type CampaignBrandProfile = {
  id: string
  brand_name: string
  user_id?: string
  user?: { id: string; name?: string | null; email: string }
}

export type CampaignStatusHistoryEntry = {
  id: string
  from_status?: CampaignStatus | null
  to_status: CampaignStatus
  note?: string | null
  created_at?: string | null
  actor?: { id: string; name?: string | null; email: string; role: string } | null
}

export type RoiEstimate = {
  est_traffic: number
  est_clicks: number
  est_orders: number
  est_gmv: number
  est_roi: number
}

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
  operational_at?: string | null
  content_type?: string | null
  content_budget?: number | null
  distribution_budget?: number | null
  start_date?: string | null
  end_date?: string | null
  est_traffic?: number | null
  est_clicks?: number | null
  est_orders?: number | null
  est_gmv?: number | null
  est_roi?: number | null
  primary_keywords?: string[]
  secondary_keywords?: string[]
  search_intent?: SearchIntent | null
  content_placement_id?: string | null
  content_placement?: ContentPlacement | null
  brand_profile?: CampaignBrandProfile | null
  publishers?: CampaignPublisherAssignment[]
  created_at?: string | null
  updated_at?: string | null
}

export type CampaignListResult = {
  items: Campaign[]
  total: number
  page?: number
  pageSize?: number
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
  primary_keywords?: string[]
  secondary_keywords?: string[]
  search_intent?: SearchIntent
  content_placement_id?: string
}

export type MarketplaceCampaign = Campaign & {
  my_application?: CampaignApplication | null
}

export type MarketplaceListResult = {
  items: MarketplaceCampaign[]
  total: number
  page?: number
  pageSize?: number
}

export type CampaignApplicationListResult = {
  items: CampaignApplication[]
  total: number
  page?: number
  pageSize?: number
}

export type UpdateCampaignBody = Partial<CreateCampaignBody>

export type CreateAdminCampaignBody = {
  brand_profile_id: string
  name: string
  target_category: string[]
  target_market: string
  product_skus: string[]
  commerce_links: string[]
  content_budget: number
  distribution_budget: number
  content_type?: string
  start_date?: string
  end_date?: string
  publisher_ids?: string[]
  primary_keywords?: string[]
  secondary_keywords?: string[]
  search_intent?: SearchIntent
  content_placement_id?: string
}

export type ConvertFromBriefBody = {
  content_budget: number
  distribution_budget: number
  content_type?: string
  start_date?: string
  end_date?: string
  publisher_ids?: string[]
  content_placement_id?: string
}

export type EstimateCampaignBody = {
  content_budget?: number
  distribution_budget?: number
  category?: string
  publisher_ids?: string[]
}

export type RoiBenchmark = {
  id: string
  category: string
  cvr: number
  aov: number
  traffic_multiplier: number
  ctr: number
}
