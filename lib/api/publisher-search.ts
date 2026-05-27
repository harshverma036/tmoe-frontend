import apiConfig from "@/lib/apiConfig"

export type PublisherSearchResult = {
  id: string
  name: string
  categories: string[]
  regions: string[]
  monthly_sessions?: number | null
  available_slot_count: number
  user?: { id: string; name?: string | null; email: string }
}

export async function fetchPublishersForAssignment(params?: {
  search?: string
  limit?: number
}): Promise<{ items: PublisherSearchResult[]; total: number }> {
  const { data } = await apiConfig.get("/api/publisher/list", {
    params: { search: params?.search, limit: params?.limit ?? 200 },
  })
  const root = data as Record<string, unknown>
  const rows = root.data
  const items = Array.isArray(rows)
    ? rows.map((r) => {
        const row = r as Record<string, unknown>
        return {
          id: String(row.id ?? ""),
          name: String(row.name ?? ""),
          categories: (row.categories as string[]) ?? [],
          regions: (row.regions as string[]) ?? [],
          monthly_sessions: row.monthly_sessions as number | null,
          available_slot_count: Number(row.available_slot_count ?? 0),
          user: row.user as PublisherSearchResult["user"],
        }
      })
    : []
  return { items, total: Number(root.total ?? items.length) }
}

export async function searchPublishers(params: {
  category?: string
  market?: string
  limit?: number
  skip?: number
}): Promise<{ items: PublisherSearchResult[]; total: number }> {
  const { data } = await apiConfig.get("/api/publisher/search", { params })
  const root = data as Record<string, unknown>
  const rows = root.data
  const items = Array.isArray(rows)
    ? rows.map((r) => {
        const row = r as Record<string, unknown>
        return {
          id: String(row.id ?? ""),
          name: String(row.name ?? ""),
          categories: (row.categories as string[]) ?? [],
          regions: (row.regions as string[]) ?? [],
          monthly_sessions: row.monthly_sessions as number | null,
          available_slot_count: Number(row.available_slot_count ?? 0),
          user: row.user as PublisherSearchResult["user"],
        }
      })
    : []
  return { items, total: Number(root.total ?? items.length) }
}
