"use client"

import { DashboardTopBar } from "@/components/layout/dashboard-top-bar"
import type { DashboardUser } from "@/components/layout/dashboard-user-menu"

type DashboardTopBarContainerProps = {
  user: DashboardUser | null
}

export function DashboardTopBarContainer({ user }: DashboardTopBarContainerProps) {
  return <DashboardTopBar user={user} />
}
