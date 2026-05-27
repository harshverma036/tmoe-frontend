"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsQueryKey,
} from "@/lib/api/notifications"

export function NotificationBell() {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => fetchNotifications({ limit: 15 }),
    refetchInterval: 60_000,
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  })

  const unread = data?.unreadCount ?? 0
  const items = data?.items ?? []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" aria-hidden />
          {unread > 0 ? (
            <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unread > 0 ? (
            <button
              type="button"
              className="text-primary text-xs font-normal hover:underline"
              onClick={() => markAllMutation.mutate()}
            >
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="text-muted-foreground px-2 py-4 text-center text-xs">
            No notifications yet
          </p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-0.5 py-2"
              onSelect={async () => {
                if (!n.read_at) {
                  await markNotificationRead(n.id)
                  queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
                }
              }}
            >
              {n.campaign_id ? (
                <Link
                  href={`/campaign/${n.campaign_id}`}
                  className="w-full text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-medium text-sm">{n.title}</span>
                  <span className="text-muted-foreground line-clamp-2 text-xs">
                    {n.message}
                  </span>
                </Link>
              ) : (
                <>
                  <span className="font-medium text-sm">{n.title}</span>
                  <span className="text-muted-foreground line-clamp-2 text-xs">
                    {n.message}
                  </span>
                </>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
