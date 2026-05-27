import apiConfig from "@/lib/apiConfig"

export type AppNotification = {
  id: string
  type: string
  title: string
  message: string
  entity_type?: string | null
  entity_id?: string | null
  campaign_id?: string | null
  read_at?: string | null
  created_at?: string | null
}

export const notificationsQueryKey = ["notifications"] as const

export async function fetchNotifications(params?: {
  limit?: number
  skip?: number
}): Promise<{ items: AppNotification[]; total: number; unreadCount: number }> {
  const { data } = await apiConfig.get("/api/notifications", {
    params: { limit: params?.limit ?? 20, skip: params?.skip ?? 0 },
  })
  const root = data as Record<string, unknown>
  const rows = root.data
  const items = Array.isArray(rows)
    ? rows.map((r) => {
        const row = r as Record<string, unknown>
        return {
          id: String(row.id ?? ""),
          type: String(row.type ?? ""),
          title: String(row.title ?? ""),
          message: String(row.message ?? ""),
          entity_type: (row.entity_type ?? row.entityType) as string | null,
          entity_id: (row.entity_id ?? row.entityId) as string | null,
          campaign_id: (row.campaign_id ?? row.campaignId) as string | null,
          read_at: (row.read_at ?? row.readAt) as string | null,
          created_at: (row.created_at ?? row.createdAt) as string | null,
        }
      })
    : []
  return {
    items,
    total: Number(root.total ?? items.length),
    unreadCount: Number(root.unreadCount ?? 0),
  }
}

export async function markNotificationRead(id: string) {
  await apiConfig.patch(`/api/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  await apiConfig.patch("/api/notifications/read-all")
}
