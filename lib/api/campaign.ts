import apiConfig from "@/lib/apiConfig"
import type {
  Campaign,
  CampaignApplication,
  CampaignApplicationListResult,
  CampaignApplicationStatus,
  CampaignListResult,
  CampaignStatus,
  CampaignStatusHistoryEntry,
  ConvertFromBriefBody,
  CreateAdminCampaignBody,
  CreateCampaignBody,
  EstimateCampaignBody,
  MarketplaceCampaign,
  MarketplaceListResult,
  RoiEstimate,
  UpdateCampaignBody,
} from "@/lib/campaign.types"

export const campaignsQueryKeyRoot = ["campaigns"] as const

export function campaignsQueryKey(filters: {
  status?: CampaignStatus
  search?: string
  limit: number
  skip: number
}) {
  return [...campaignsQueryKeyRoot, filters] as const
}

export function campaignQueryKey(id: string) {
  return ["campaign", id] as const
}

export function campaignHistoryQueryKey(id: string) {
  return ["campaign", id, "history"] as const
}

export const marketplaceQueryKeyRoot = ["campaign-marketplace"] as const

export function marketplaceQueryKey(filters: {
  search?: string
  limit: number
  skip: number
}) {
  return [...marketplaceQueryKeyRoot, filters] as const
}

export function campaignApplicationsQueryKey(campaignId: string) {
  return ["campaign", campaignId, "applications"] as const
}

function normalizeApplication(row: Record<string, unknown>): CampaignApplication {
  const pubProf = (row.publisher_profile ?? row.publisherProfile) as
    | Record<string, unknown>
    | undefined
  const reviewedBy = (row.reviewed_by ?? row.reviewedBy) as
    | Record<string, unknown>
    | undefined
  return {
    id: String(row.id ?? ""),
    campaign_id: (row.campaign_id ?? row.campaignId) as string | undefined,
    publisher_profile_id: (row.publisher_profile_id ??
      row.publisherProfileId) as string | undefined,
    status: String(row.status ?? "PENDING").toUpperCase() as CampaignApplicationStatus,
    note: (row.note as string) ?? null,
    rejection_note: (row.rejection_note ?? row.rejectionNote) as string | null,
    reviewed_at: (row.reviewed_at ?? row.reviewedAt) as string | null,
    created_at: (row.created_at ?? row.createdAt) as string | null,
    publisher_profile: pubProf
      ? {
          id: String(pubProf.id ?? ""),
          publication_name: (pubProf.publication_name ??
            pubProf.publicationName) as string | null,
          content_categories: asStringArray(
            pubProf.content_categories ?? pubProf.contentCategories,
          ),
          monthly_sessions: asNumber(
            pubProf.monthly_sessions ?? pubProf.monthlySessions,
          ),
          user: pubProf.user as {
            id: string
            name?: string | null
            email: string
          },
        }
      : undefined,
    reviewed_by: reviewedBy
      ? {
          id: String(reviewedBy.id ?? ""),
          name: (reviewedBy.name as string) ?? null,
          email: String(reviewedBy.email ?? ""),
        }
      : null,
  }
}

function normalizeMarketplaceCampaign(row: Record<string, unknown>): MarketplaceCampaign {
  const campaign = normalizeCampaign(row)
  const myAppRaw = row.my_application ?? row.myApplication
  const myApp = Array.isArray(myAppRaw)
    ? myAppRaw[0]
    : myAppRaw
  return {
    ...campaign,
    my_application: myApp
      ? normalizeApplication(myApp as Record<string, unknown>)
      : null,
  }
}

function readProp(
  row: Record<string, unknown>,
  snake: string,
  camel: string,
): unknown {
  if (row[snake] !== undefined && row[snake] !== null) return row[snake]
  if (row[camel] !== undefined && row[camel] !== null) return row[camel]
  return undefined
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x ?? "").trim()).filter(Boolean)
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : Number(v)
  if (Number.isNaN(n)) return null
  return n
}

const ALL_STATUSES: CampaignStatus[] = [
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
]

export function normalizeCampaign(row: Record<string, unknown>): Campaign {
  const id = String(readProp(row, "id", "id") ?? "")
  const statusRaw = String(readProp(row, "status", "status") ?? "DRAFT").toUpperCase()
  const status = (
    ALL_STATUSES.includes(statusRaw as CampaignStatus) ? statusRaw : "DRAFT"
  ) as Campaign["status"]

  const publishersRaw = readProp(row, "publishers", "publishers")
  const publishers = Array.isArray(publishersRaw)
    ? publishersRaw.map((p) => {
        const pr = p as Record<string, unknown>
        const pubProf = (pr.publisher_profile ?? pr.publisherProfile) as
          | Record<string, unknown>
          | undefined
        return {
          id: String(pr.id ?? ""),
          publisher_profile_id: String(
            readProp(pr, "publisher_profile_id", "publisherProfileId") ?? "",
          ),
          assigned_at: (readProp(pr, "assigned_at", "assignedAt") as string) ?? null,
          accepted_at: (readProp(pr, "accepted_at", "acceptedAt") as string) ?? null,
          publisher_profile: pubProf
            ? {
                id: String(pubProf.id ?? ""),
                publication_name: (pubProf.publication_name ??
                  pubProf.publicationName) as string | null,
                monthly_sessions: asNumber(
                  pubProf.monthly_sessions ?? pubProf.monthlySessions,
                ),
                user: pubProf.user as {
                  id: string
                  name?: string | null
                  email: string
                },
              }
            : undefined,
        }
      })
    : undefined

  const brandRaw = readProp(row, "brand_profile", "brandProfile") as
    | Record<string, unknown>
    | undefined

  return {
    id,
    name: String(readProp(row, "name", "name") ?? ""),
    target_category: asStringArray(readProp(row, "target_category", "targetCategory")),
    target_market: String(readProp(row, "target_market", "targetMarket") ?? ""),
    product_skus: asStringArray(readProp(row, "product_skus", "productSkus")),
    budget_min: asNumber(readProp(row, "budget_min", "budgetMin")) ?? 0,
    budget_max: asNumber(readProp(row, "budget_max", "budgetMax")) ?? 0,
    gmv_target: asNumber(readProp(row, "gmv_target", "gmvTarget")),
    roi_target: asNumber(readProp(row, "roi_target", "roiTarget")),
    commerce_links: asStringArray(readProp(row, "commerce_links", "commerceLinks")),
    description: (() => {
      const v = readProp(row, "description", "description")
      if (v === undefined || v === null) return null
      return String(v)
    })(),
    status,
    operational_at: (readProp(row, "operational_at", "operationalAt") as string) ?? null,
    content_type: (readProp(row, "content_type", "contentType") as string) ?? null,
    content_budget: asNumber(readProp(row, "content_budget", "contentBudget")),
    distribution_budget: asNumber(
      readProp(row, "distribution_budget", "distributionBudget"),
    ),
    start_date: (readProp(row, "start_date", "startDate") as string) ?? null,
    end_date: (readProp(row, "end_date", "endDate") as string) ?? null,
    est_traffic: asNumber(readProp(row, "est_traffic", "estTraffic")),
    est_clicks: asNumber(readProp(row, "est_clicks", "estClicks")),
    est_orders: asNumber(readProp(row, "est_orders", "estOrders")),
    est_gmv: asNumber(readProp(row, "est_gmv", "estGmv")),
    est_roi: asNumber(readProp(row, "est_roi", "estRoi")),
    primary_keywords: asStringArray(
      readProp(row, "primary_keywords", "primaryKeywords"),
    ),
    secondary_keywords: asStringArray(
      readProp(row, "secondary_keywords", "secondaryKeywords"),
    ),
    search_intent: (() => {
      const v = readProp(row, "search_intent", "searchIntent")
      if (!v) return null
      return String(v).toUpperCase() as Campaign["search_intent"]
    })(),
    brand_profile: brandRaw
      ? {
          id: String(brandRaw.id ?? ""),
          brand_name: String(brandRaw.brand_name ?? brandRaw.brandName ?? ""),
          user_id: (brandRaw.user_id ?? brandRaw.userId) as string | undefined,
          user: brandRaw.user as {
            id: string
            name?: string | null
            email: string
          },
        }
      : null,
    publishers,
    created_at: (readProp(row, "created_at", "createdAt") as string) ?? null,
    updated_at: (readProp(row, "updated_at", "updatedAt") as string) ?? null,
  }
}

function unwrapPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {}
  const p = payload as Record<string, unknown>
  const inner = p.data
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const d = inner as Record<string, unknown>
    if (d.data && typeof d.data === "object" && !Array.isArray(d.data)) {
      return d.data as Record<string, unknown>
    }
    return d
  }
  return p
}

function parseListEnvelope(body: unknown): CampaignListResult {
  const root = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  const data = root.data

  if (Array.isArray(data)) {
    const total =
      typeof root.total === "number"
        ? root.total
        : typeof (root as { count?: number }).count === "number"
          ? (root as { count: number }).count
          : data.length
    return {
      items: data.map((r) => normalizeCampaign(r as Record<string, unknown>)),
      total,
      page: typeof root.page === "number" ? root.page : undefined,
      pageSize:
        typeof root.pageSize === "number" ? root.pageSize : undefined,
    }
  }

  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>
    const itemsRaw = Array.isArray(d) ? d : d.items ?? d.results ?? d.rows ?? d.campaigns
    if (Array.isArray(itemsRaw)) {
      const total =
        typeof d.total === "number"
          ? d.total
          : typeof root.total === "number"
            ? (root.total as number)
            : itemsRaw.length
      return {
        items: itemsRaw.map((r) => normalizeCampaign(r as Record<string, unknown>)),
        total,
        page: typeof d.page === "number" ? d.page : undefined,
        pageSize: typeof d.pageSize === "number" ? d.pageSize : undefined,
      }
    }
    if (Array.isArray(data)) {
      return {
        items: (data as unknown[]).map((r) =>
          normalizeCampaign(r as Record<string, unknown>),
        ),
        total: (root.total as number) ?? data.length,
      }
    }
  }

  return { items: [], total: 0 }
}

export async function fetchCampaigns(params: {
  status?: CampaignStatus
  search?: string
  limit?: number
  skip?: number
}): Promise<CampaignListResult> {
  const search = params.search?.trim()
  const { data } = await apiConfig.get("/api/campaign", {
    params: {
      status: params.status,
      search: search || undefined,
      limit: params.limit ?? 20,
      skip: params.skip ?? 0,
    },
  })
  return parseListEnvelope(data)
}

export async function fetchCampaignById(id: string): Promise<Campaign> {
  const { data } = await apiConfig.get(`/api/campaign/${id}`)
  const raw = unwrapPayload(data)
  return normalizeCampaign(raw)
}

export async function fetchCampaignHistory(
  id: string,
): Promise<CampaignStatusHistoryEntry[]> {
  const { data } = await apiConfig.get(`/api/campaign/${id}/history`)
  const root = data as Record<string, unknown>
  const rows = (root.data ?? root) as unknown[]
  if (!Array.isArray(rows)) return []
  return rows.map((r) => {
    const row = r as Record<string, unknown>
    return {
      id: String(row.id ?? ""),
      from_status: (row.from_status ?? row.fromStatus) as CampaignStatus | null,
      to_status: String(row.to_status ?? row.toStatus ?? "") as CampaignStatus,
      note: (row.note as string) ?? null,
      created_at: (row.created_at ?? row.createdAt) as string | null,
      actor: row.actor as CampaignStatusHistoryEntry["actor"],
    }
  })
}

export async function createCampaign(body: CreateCampaignBody): Promise<Campaign> {
  const { data } = await apiConfig.post("/api/campaign", body)
  return normalizeCampaign(unwrapPayload(data))
}

export async function createAdminCampaign(
  body: CreateAdminCampaignBody,
): Promise<Campaign> {
  const { data } = await apiConfig.post("/api/campaign/admin", body)
  return normalizeCampaign(unwrapPayload(data))
}

export async function convertFromBrief(
  briefId: string,
  body: ConvertFromBriefBody,
): Promise<Campaign> {
  const { data } = await apiConfig.post(`/api/campaign/from-brief/${briefId}`, body)
  return normalizeCampaign(unwrapPayload(data))
}

export async function updateCampaign(
  id: string,
  body: UpdateCampaignBody,
): Promise<Campaign> {
  const { data } = await apiConfig.put(`/api/campaign/${id}`, body)
  return normalizeCampaign(unwrapPayload(data))
}

export async function updateAdminCampaign(
  id: string,
  body: Record<string, unknown>,
): Promise<Campaign> {
  const { data } = await apiConfig.put(`/api/campaign/${id}/admin`, body)
  return normalizeCampaign(unwrapPayload(data))
}

export async function deleteCampaign(id: string): Promise<void> {
  await apiConfig.delete(`/api/campaign/${id}`)
}

export async function submitCampaignForReview(id: string): Promise<Campaign> {
  const { data } = await apiConfig.patch(`/api/campaign/${id}/submit`)
  return normalizeCampaign(unwrapPayload(data))
}

export async function reviewCampaign(
  id: string,
  status: "APPROVED" | "REJECTED",
  note?: string,
): Promise<Campaign> {
  const { data } = await apiConfig.patch(`/api/campaign/${id}/review`, {
    status,
    note,
  })
  return normalizeCampaign(unwrapPayload(data))
}

export async function transitionCampaignStatus(
  id: string,
  status: CampaignStatus,
  note?: string,
): Promise<Campaign> {
  const { data } = await apiConfig.patch(`/api/campaign/${id}/status`, {
    status,
    note,
  })
  return normalizeCampaign(unwrapPayload(data))
}

export async function assignPublishers(
  id: string,
  publisherIds: string[],
): Promise<void> {
  await apiConfig.post(`/api/campaign/${id}/publishers`, {
    publisher_ids: publisherIds,
  })
}

export async function removePublisher(
  campaignId: string,
  publisherProfileId: string,
): Promise<void> {
  await apiConfig.delete(
    `/api/campaign/${campaignId}/publishers/${publisherProfileId}`,
  )
}

export async function estimateCampaign(
  id: string,
  body: EstimateCampaignBody,
): Promise<RoiEstimate & { campaign?: Campaign }> {
  const { data } = await apiConfig.post(`/api/campaign/${id}/estimate`, body)
  const root = unwrapPayload(data)
  return {
    est_traffic: Number(root.est_traffic ?? root.estTraffic ?? 0),
    est_clicks: Number(root.est_clicks ?? root.estClicks ?? 0),
    est_orders: Number(root.est_orders ?? root.estOrders ?? 0),
    est_gmv: Number(root.est_gmv ?? root.estGmv ?? 0),
    est_roi: Number(root.est_roi ?? root.estRoi ?? 0),
    campaign: root.campaign
      ? normalizeCampaign(root.campaign as Record<string, unknown>)
      : undefined,
  }
}

export async function acceptCampaignAssignment(id: string): Promise<void> {
  await apiConfig.patch(`/api/campaign/${id}/accept`)
}

export async function rejectCampaignAssignment(
  id: string,
  note?: string,
): Promise<void> {
  await apiConfig.patch(`/api/campaign/${id}/reject-assignment`, {
    note: note?.trim() || undefined,
  })
}

export async function fetchMarketplaceCampaigns(params: {
  search?: string
  limit?: number
  skip?: number
}): Promise<MarketplaceListResult> {
  const { data } = await apiConfig.get("/api/campaign/marketplace", {
    params: {
      search: params.search?.trim() || undefined,
      limit: params.limit ?? 12,
      skip: params.skip ?? 0,
    },
  })
  const root = data as Record<string, unknown>
  const rows = (root.data ?? []) as unknown[]
  const total =
    typeof root.total === "number" ? root.total : Array.isArray(rows) ? rows.length : 0
  return {
    items: Array.isArray(rows)
      ? rows.map((r) => normalizeMarketplaceCampaign(r as Record<string, unknown>))
      : [],
    total,
    page: typeof root.page === "number" ? root.page : undefined,
    pageSize: typeof root.pageSize === "number" ? root.pageSize : undefined,
  }
}

export async function fetchMarketplaceCampaignById(
  id: string,
): Promise<MarketplaceCampaign> {
  const { data } = await apiConfig.get(`/api/campaign/marketplace/${id}`)
  const raw = unwrapPayload(data)
  return normalizeMarketplaceCampaign(raw)
}

export async function applyToCampaign(
  id: string,
  note?: string,
): Promise<CampaignApplication> {
  const { data } = await apiConfig.post(`/api/campaign/${id}/apply`, {
    note: note?.trim() || undefined,
  })
  const raw = unwrapPayload(data)
  return normalizeApplication(raw)
}

export async function fetchCampaignApplications(
  campaignId: string,
  params?: { status?: CampaignApplicationStatus; limit?: number; skip?: number },
): Promise<CampaignApplicationListResult> {
  const { data } = await apiConfig.get(`/api/campaign/${campaignId}/applications`, {
    params: {
      status: params?.status,
      limit: params?.limit ?? 20,
      skip: params?.skip ?? 0,
    },
  })
  const root = data as Record<string, unknown>
  const rows = (root.data ?? []) as unknown[]
  const total =
    typeof root.total === "number" ? root.total : Array.isArray(rows) ? rows.length : 0
  return {
    items: Array.isArray(rows)
      ? rows.map((r) => normalizeApplication(r as Record<string, unknown>))
      : [],
    total,
    page: typeof root.page === "number" ? root.page : undefined,
    pageSize: typeof root.pageSize === "number" ? root.pageSize : undefined,
  }
}

export async function reviewCampaignApplication(
  campaignId: string,
  applicationId: string,
  status: "APPROVED" | "REJECTED",
  rejection_note?: string,
): Promise<CampaignApplication> {
  const { data } = await apiConfig.patch(
    `/api/campaign/${campaignId}/applications/${applicationId}/review`,
    { status, rejection_note: rejection_note?.trim() || undefined },
  )
  const raw = unwrapPayload(data)
  return normalizeApplication(raw)
}
