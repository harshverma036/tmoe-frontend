"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { NotificationBell } from "@/components/layout/notification-bell"
import {
  DashboardUserMenu,
  type DashboardUser,
} from "@/components/layout/dashboard-user-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserRole, normalizeUserRole } from "@/lib/dashboard-nav"

type DashboardTopBarProps = {
  user: DashboardUser | null
}

function getRoleLabel(role: string | null | undefined) {
  const resolved = normalizeUserRole(role)
  switch (resolved) {
    case UserRole.ADMIN:
      return "Ops admin · L3"
    case UserRole.PUBLISHER:
      return "Publisher"
    case UserRole.BRAND:
      return "Brand"
    default:
      return "Account"
  }
}

export function DashboardTopBar({ user }: DashboardTopBarProps) {
  const searchRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-3 border-b border-border/80 bg-card/95 px-4 backdrop-blur-sm sm:gap-4 sm:px-5">
      <SidebarTrigger className="md:hidden" />

      <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg xl:max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          placeholder="Search users, campaigns..."
          readOnly
          aria-label="Global navigation search"
          className="h-10 cursor-default rounded-xl border-border/80 bg-muted/50 pl-9 pr-16 shadow-none"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
        <NotificationBell />

        <DashboardUserMenu
          user={user}
          variant="inline"
          roleLabel={getRoleLabel(user?.role)}
        />
      </div>
    </header>
  )
}
