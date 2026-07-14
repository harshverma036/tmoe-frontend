import apiConfig from "@/lib/apiConfig"
import type {
  ContentPlacement,
  ContentPlacementListResult,
  CreateContentPlacementBody,
  UpdateContentPlacementBody,
} from "@/lib/content-placement.types"

export const contentPlacementsQueryKey = ["content-placements"] as const

export function contentPlacementQueryKey(id: string) {
  return ["content-placement", id] as const
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

export function normalizeContentPlacement(row: Record<string, unknown>): ContentPlacement {
  return {
    id: String(row.id ?? ""),
    name: String(readProp(row, "name", "name") ?? ""),
    position: (readProp(row, "position", "position") as ContentPlacement["position"]) ?? null,
    description: (readProp(row, "description", "description") as string) ?? null,
    created_at: (readProp(row, "created_at", "createdAt") as string) ?? null,
    updated_at: (readProp(row, "updated_at", "updatedAt") as string) ?? null,
  }
}

function unwrapList(payload: unknown): ContentPlacementListResult {
  const root = (payload ?? {}) as Record<string, unknown>
  const rows = root.data
  const items = Array.isArray(rows)
    ? rows.map((r) => normalizeContentPlacement(r as Record<string, unknown>))
    : []
  return {
    items,
    total: Number(root.total ?? items.length),
    page: Number(root.page ?? 1),
    pageSize: Number(root.pageSize ?? (items.length || 20)),
  }
}

export async function fetchContentPlacements(params?: {
  limit?: number
  skip?: number
  search?: string
}): Promise<ContentPlacementListResult> {
  const { data } = await apiConfig.get("/api/content-placements", {
    params: {
      limit: params?.limit ?? 100,
      skip: params?.skip ?? 0,
      ...(params?.search ? { search: params.search, search_field: "name" } : {}),
    },
  })
  return unwrapList(data)
}

export async function fetchContentPlacementById(id: string): Promise<ContentPlacement> {
  const { data } = await apiConfig.get(`/api/content-placements/${id}`)
  const root = (data ?? {}) as Record<string, unknown>
  const row = (root.data ?? root) as Record<string, unknown>
  return normalizeContentPlacement(row)
}

export async function createContentPlacement(
  body: CreateContentPlacementBody,
): Promise<ContentPlacement> {
  const { data } = await apiConfig.post("/api/content-placements", body)
  const root = (data ?? {}) as Record<string, unknown>
  const row = (root.data ?? root) as Record<string, unknown>
  return normalizeContentPlacement(row)
}

export async function updateContentPlacement(
  id: string,
  body: UpdateContentPlacementBody,
): Promise<ContentPlacement> {
  const { data } = await apiConfig.patch(`/api/content-placements/${id}`, body)
  const root = (data ?? {}) as Record<string, unknown>
  const row = (root.data ?? root) as Record<string, unknown>
  return normalizeContentPlacement(row)
}

export async function deleteContentPlacement(id: string): Promise<void> {
  await apiConfig.delete(`/api/content-placements/${id}`)
}
