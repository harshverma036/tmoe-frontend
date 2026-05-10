import apiConfig from "@/lib/apiConfig"

import type {
  ContentSlot,
  ContentSlotFormValues,
} from "@/lib/validation/content-slot-form"

// /** Row shape from GET /api/publisher/content-slot/all */
// export type ApiContentSlotRow = {
//   id: string
//   publisher_profile_id: string
//   type: string
//   category: string
//   estimated_traffic: number
//   monetisation_model: string
//   created_by_id: string
//   createdAt: string
//   updatedAt: string
// }

// type ContentSlotsAllResponse = {
//   data: ApiContentSlotRow[]
//   message: string
// }

export const contentSlotsQueryKey = ["content-slots"] as const

export function mapApiContentSlotToSlot(row: any): ContentSlot {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    type: row.type,
    category: row.category,
    estimated_traffic: row.estimated_traffic,
    monetisation_model: row.monetisation_model,
  }
}

export async function fetchContentSlots(): Promise<ContentSlot[]> {
  const { data } = await apiConfig.get(
    "/api/publisher/content-slot/all",
  )
  return data.data ?? []
}

export async function createContentSlot(
  payload: ContentSlotFormValues,
): Promise<unknown> {
  const { data } = await apiConfig.post(
    "/api/publisher/content-slot",
    payload,
  )
  return data
}

export async function updateContentSlot(
  id: string,
  payload: ContentSlotFormValues,
): Promise<unknown> {
  const { data } = await apiConfig.patch(
    `/api/publisher/content-slot/${id}`,
    payload,
  )
  return data
}
