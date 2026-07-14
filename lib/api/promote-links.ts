import apiConfig from "@/lib/apiConfig"

export type PromoteLinkBrand = {
  id: string
  brand_name: string
  network_type?: string
  impact_program_id: string | null
  impact_program_name: string | null
  commerce_links: string[]
}

export type ImpactCampaign = {
  campaignId: string
  campaignName: string
  advertiserName: string
  campaignUrl: string
}

export type PublisherImpactProperty = {
  id: string
  publisher_profile_id: string
  impact_property_id: string
  name: string
  publisher_profile?: {
    id: string
    publication_name: string | null
    user?: { name?: string | null; email: string }
  }
}

export type PromoteLink = {
  id: string
  brand_profile_id: string
  publisher_profile_id: string | null
  campaign_id: string | null
  impact_program_id: string
  landing_page: string | null
  sub_id_1: string | null
  sub_id_2: string | null
  sub_id_3: string | null
  shared_id: string | null
  impact_property_id: string | null
  generated_url: string
  method: string
  click_count: number
  created_at: string
  brand_profile?: {
    id: string
    brand_name: string
    impact_program_id: string | null
  }
  publisher_profile?: {
    id: string
    publication_name: string | null
    user?: { id: string; name?: string | null; email: string }
  }
  created_by?: {
    id: string
    name?: string | null
    email: string
    role: string
  }
}

export type CreatePromoteLinkPayload = {
  brand_profile_id: string
  publisher_profile_id?: string
  landing_page?: string
  sub_id_1?: string
  sub_id_2?: string
  sub_id_3?: string
  shared_id?: string
  impact_property_id?: string
}

export const promoteLinksQueryKey = ["promote-links"] as const
export const promoteLinkBrandsQueryKey = ["promote-links", "brands"] as const
export const promoteLinkPropertiesQueryKey = (publisherProfileId?: string) =>
  ["promote-links", "properties", publisherProfileId ?? "self"] as const
export const impactCampaignsQueryKey = ["promote-links", "impact-campaigns"] as const

function normalizePromoteLink(row: Record<string, unknown>): PromoteLink {
  return {
    id: String(row.id ?? ""),
    brand_profile_id: String(row.brand_profile_id ?? row.brandProfileId ?? ""),
    publisher_profile_id: (row.publisher_profile_id ??
      row.publisherProfileId) as string | null,
    campaign_id: (row.campaign_id ?? row.campaignId) as string | null,
    impact_program_id: String(row.impact_program_id ?? row.impactProgramId ?? ""),
    landing_page: (row.landing_page ?? row.landingPage) as string | null,
    sub_id_1: (row.sub_id_1 ?? row.subId1) as string | null,
    sub_id_2: (row.sub_id_2 ?? row.subId2) as string | null,
    sub_id_3: (row.sub_id_3 ?? row.subId3) as string | null,
    shared_id: (row.shared_id ?? row.sharedId) as string | null,
    impact_property_id: (row.impact_property_id ??
      row.impactPropertyId) as string | null,
    generated_url: String(row.generated_url ?? row.generatedUrl ?? ""),
    method: String(row.method ?? "IMPACT"),
    click_count: Number(row.click_count ?? row.clickCount ?? 0),
    created_at: String(row.createdAt ?? row.created_at ?? ""),
    brand_profile: row.brand_profile as PromoteLink["brand_profile"],
    publisher_profile: row.publisher_profile as PromoteLink["publisher_profile"],
    created_by: row.created_by as PromoteLink["created_by"],
  }
}

export async function fetchPromoteLinks(params?: {
  page?: number
  pageSize?: number
  brand_profile_id?: string
}) {
  const response = await apiConfig.get("/api/promote-links", {
    params: {
      page_number: params?.page?.toString() ?? "1",
      limit: params?.pageSize?.toString() ?? "20",
      skip: params?.page
        ? String((params.page - 1) * (params.pageSize ?? 20))
        : "0",
      brand_profile_id: params?.brand_profile_id,
    },
  })
  const body = response.data
  return {
    data: (body.data ?? []).map((row: Record<string, unknown>) =>
      normalizePromoteLink(row),
    ),
    total: Number(body.total ?? 0),
    page: Number(body.page ?? 1),
    pageSize: Number(body.pageSize ?? 20),
  }
}

export async function fetchPromoteLinkBrands(): Promise<PromoteLinkBrand[]> {
  const response = await apiConfig.get("/api/promote-links/brands")
  return response.data?.data ?? []
}

export async function fetchImpactCampaigns(): Promise<ImpactCampaign[]> {
  const response = await apiConfig.get("/api/promote-links/impact-campaigns")
  return response.data?.data ?? []
}

export async function fetchPromoteLinkProperties(publisherProfileId?: string) {
  const response = await apiConfig.get("/api/promote-links/properties", {
    params: publisherProfileId
      ? { publisher_profile_id: publisherProfileId }
      : undefined,
  })
  return (response.data?.data ?? []) as PublisherImpactProperty[]
}

export async function createPromoteLink(payload: CreatePromoteLinkPayload) {
  const response = await apiConfig.post("/api/promote-links", payload)
  return normalizePromoteLink(response.data?.data ?? {})
}

export async function createPublisherProperty(payload: {
  impact_property_id: string
  name: string
  publisher_profile_id?: string
}) {
  const response = await apiConfig.post("/api/promote-links/properties", payload)
  return response.data?.data
}

export async function updateBrandImpactConfig(
  brandProfileId: string,
  payload: {
    impact_program_id: string
    impact_program_name?: string
    network_type?: string
  },
) {
  const response = await apiConfig.put(
    `/api/promote-links/brand/${brandProfileId}/impact-config`,
    {
      network_type: "IMPACT",
      ...payload,
    },
  )
  return response.data?.data
}
