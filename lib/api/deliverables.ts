import apiConfig from "@/lib/apiConfig"

export type DeliverableStatus = "PENDING" | "SUBMITTED" | "DELIVERED" | "REJECTED"

export type ContentDeliverable = {
  id: string
  campaign_id: string
  publisher_profile_id: string | null
  type: string
  description: string | null
  status: DeliverableStatus
  submitted_url: string | null
  submitted_at: string | null
  admin_note: string | null
  article_title: string | null
  thumbnail_url: string | null
  published_at: string | null
  publisher_profile?: {
    id: string
    publication_name: string | null
    user?: { id: string; name?: string | null; email: string }
  }
  created_at?: string | null
  updated_at?: string | null
}

export type DeliverablesSummary = {
  total: number
  delivered: number
  content_complete: boolean
}

export const deliverablesQueryKey = (campaignId: string) =>
  ["campaign", campaignId, "deliverables"] as const

function normalizeDeliverable(row: Record<string, unknown>): ContentDeliverable {
  return {
    id: String(row.id ?? ""),
    campaign_id: String(row.campaign_id ?? row.campaignId ?? ""),
    publisher_profile_id:
      (row.publisher_profile_id ?? row.publisherProfileId) as string | null,
    type: String(row.type ?? ""),
    description: (row.description as string) ?? null,
    status: String(row.status ?? "PENDING").toUpperCase() as DeliverableStatus,
    submitted_url: (row.submitted_url ?? row.submittedUrl) as string | null,
    submitted_at: (row.submitted_at ?? row.submittedAt) as string | null,
    admin_note: (row.admin_note ?? row.adminNote) as string | null,
    article_title: (row.article_title ?? row.articleTitle) as string | null,
    thumbnail_url: (row.thumbnail_url ?? row.thumbnailUrl) as string | null,
    published_at: (row.published_at ?? row.publishedAt) as string | null,
    publisher_profile: row.publisher_profile as ContentDeliverable["publisher_profile"],
    created_at: (row.created_at ?? row.createdAt) as string | null,
    updated_at: (row.updated_at ?? row.updatedAt) as string | null,
  }
}

export async function fetchDeliverables(campaignId: string): Promise<{
  items: ContentDeliverable[]
  summary: DeliverablesSummary
}> {
  const { data } = await apiConfig.get(`/api/campaign/${campaignId}/deliverables`)
  const root = data as Record<string, unknown>
  const payload = (root.data ?? root) as Record<string, unknown>
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : []
  const summaryRaw = (payload.summary ?? root.summary) as Record<string, unknown> | undefined
  return {
    items: rows.map((r) => normalizeDeliverable(r as Record<string, unknown>)),
    summary: {
      total: Number(summaryRaw?.total ?? rows.length),
      delivered: Number(summaryRaw?.delivered ?? 0),
      content_complete: Boolean(summaryRaw?.content_complete ?? summaryRaw?.contentComplete),
    },
  }
}

export async function createDeliverable(
  campaignId: string,
  body: {
    type: string
    description?: string
    publisher_profile_id?: string
  },
): Promise<ContentDeliverable> {
  const { data } = await apiConfig.post(`/api/campaign/${campaignId}/deliverables`, body)
  const root = data as Record<string, unknown>
  const row = (root.data ?? root) as Record<string, unknown>
  return normalizeDeliverable(row)
}

export async function submitDeliverableUrl(
  campaignId: string,
  deliverableId: string,
  submitted_url: string,
): Promise<ContentDeliverable> {
  const { data } = await apiConfig.patch(
    `/api/campaign/${campaignId}/deliverables/${deliverableId}/submit-url`,
    { submitted_url },
  )
  const root = data as Record<string, unknown>
  const row = (root.data ?? root) as Record<string, unknown>
  return normalizeDeliverable(row)
}

export async function approveDeliverable(
  campaignId: string,
  deliverableId: string,
): Promise<void> {
  await apiConfig.patch(
    `/api/campaign/${campaignId}/deliverables/${deliverableId}/approve`,
  )
}

export async function rejectDeliverable(
  campaignId: string,
  deliverableId: string,
  note?: string,
): Promise<void> {
  await apiConfig.patch(
    `/api/campaign/${campaignId}/deliverables/${deliverableId}/reject`,
    { note },
  )
}

export async function needsRevisionDeliverable(
  campaignId: string,
  deliverableId: string,
  note?: string,
): Promise<void> {
  await apiConfig.patch(
    `/api/campaign/${campaignId}/deliverables/${deliverableId}/needs-revision`,
    { note },
  )
}
