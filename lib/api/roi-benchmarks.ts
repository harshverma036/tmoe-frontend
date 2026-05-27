import apiConfig from "@/lib/apiConfig"
import type { RoiBenchmark } from "@/lib/campaign.types"

export const roiBenchmarksQueryKey = ["roi-benchmarks"] as const

function normalize(row: Record<string, unknown>): RoiBenchmark {
  return {
    id: String(row.id ?? ""),
    category: String(row.category ?? ""),
    cvr: Number(row.cvr ?? 0),
    aov: Number(row.aov ?? 0),
    traffic_multiplier: Number(row.traffic_multiplier ?? row.trafficMultiplier ?? 1),
    ctr: Number(row.ctr ?? 0),
  }
}

export async function fetchRoiBenchmarks(): Promise<RoiBenchmark[]> {
  const { data } = await apiConfig.get("/api/roi-benchmarks")
  const root = data as Record<string, unknown>
  const rows = root.data ?? root
  if (!Array.isArray(rows)) return []
  return rows.map((r) => normalize(r as Record<string, unknown>))
}

export async function createRoiBenchmark(body: Omit<RoiBenchmark, "id">) {
  const { data } = await apiConfig.post("/api/roi-benchmarks", body)
  const root = data as Record<string, unknown>
  return normalize((root.data ?? root) as Record<string, unknown>)
}

export async function updateRoiBenchmark(
  id: string,
  body: Partial<Omit<RoiBenchmark, "id" | "category">>,
) {
  const { data } = await apiConfig.put(`/api/roi-benchmarks/${id}`, body)
  const root = data as Record<string, unknown>
  return normalize((root.data ?? root) as Record<string, unknown>)
}
