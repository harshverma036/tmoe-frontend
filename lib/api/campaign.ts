import apiConfig from "@/lib/apiConfig"
import type {
  Campaign,
  CampaignListResult,
  CampaignStatus,
  CreateCampaignBody,
  UpdateCampaignBody,
} from "@/lib/campaign.types"

export const campaignsQueryKeyRoot = ["campaigns"] as const

export function campaignsQueryKey(filters: {
  status?: CampaignStatus
  limit: number
  skip: number
}) {
  return [...campaignsQueryKeyRoot, filters] as const
}

export function campaignQueryKey(id: string) {
  return ["campaign", id] as const
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

/** Normalizes Prisma / DTO rows (snake_case or camelCase). */
export function normalizeCampaign(row: Record<string, unknown>): Campaign {
  const id = String(readProp(row, "id", "id") ?? "")
  const statusRaw = String(
    readProp(row, "status", "status") ?? "DRAFT",
  ).toUpperCase()
  const status = (
    ["DRAFT", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(statusRaw)
      ? statusRaw
      : "DRAFT"
  ) as Campaign["status"]

  return {
    id,
    name: String(readProp(row, "name", "name") ?? ""),
    target_category: asStringArray(
      readProp(row, "target_category", "targetCategory"),
    ),
    target_market: String(
      readProp(row, "target_market", "targetMarket") ?? "",
    ),
    product_skus: asStringArray(
      readProp(row, "product_skus", "productSkus"),
    ),
    budget_min: asNumber(readProp(row, "budget_min", "budgetMin")) ?? 0,
    budget_max: asNumber(readProp(row, "budget_max", "budgetMax")) ?? 0,
    gmv_target: asNumber(readProp(row, "gmv_target", "gmvTarget")),
    roi_target: asNumber(readProp(row, "roi_target", "roiTarget")),
    commerce_links: asStringArray(
      readProp(row, "commerce_links", "commerceLinks"),
    ),
    description: (() => {
      const v = readProp(row, "description", "description")
      if (v === undefined || v === null) return null
      return String(v)
    })(),
    status,
    created_at:
      (readProp(row, "created_at", "createdAt") as string | null) ?? null,
    updated_at:
      (readProp(row, "updated_at", "updatedAt") as string | null) ?? null,
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
    return {
      items: data.map((r) => normalizeCampaign(r as Record<string, unknown>)),
      total: data.length,
    }
  }

  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>
    const itemsRaw = d.items ?? d.results ?? d.rows ?? d.campaigns
    if (Array.isArray(itemsRaw)) {
      const total =
        typeof d.total === "number"
          ? d.total
          : typeof d.count === "number"
            ? d.count
            : itemsRaw.length
      return {
        items: itemsRaw.map((r) =>
          normalizeCampaign(r as Record<string, unknown>),
        ),
        total,
      }
    }
  }

  return { items: [], total: 0 }
}

export async function fetchCampaigns(params: {
  status?: CampaignStatus
  limit?: number
  skip?: number
}): Promise<CampaignListResult> {
  const { data } = await apiConfig.get("/api/campaign", {
    params: {
      status: params.status,
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

export async function createCampaign(
  body: CreateCampaignBody,
): Promise<Campaign> {
  const { data } = await apiConfig.post("/api/campaign", body)
  const raw = unwrapPayload(data)
  return normalizeCampaign(raw)
}

export async function updateCampaign(
  id: string,
  body: UpdateCampaignBody,
): Promise<Campaign> {
  const { data } = await apiConfig.put(`/api/campaign/${id}`, body)
  const raw = unwrapPayload(data)
  return normalizeCampaign(raw)
}

export async function deleteCampaign(id: string): Promise<void> {
  await apiConfig.delete(`/api/campaign/${id}`)
}

export async function submitCampaignForReview(id: string): Promise<Campaign> {
  const { data } = await apiConfig.patch(`/api/campaign/${id}/submit`)
  const raw = unwrapPayload(data)
  return normalizeCampaign(raw)
}

export async function reviewCampaign(
  id: string,
  status: "APPROVED" | "REJECTED",
): Promise<Campaign> {
  const { data } = await apiConfig.patch(`/api/campaign/${id}/review`, {
    status,
  })
  const raw = unwrapPayload(data)
  return normalizeCampaign(raw)
}
