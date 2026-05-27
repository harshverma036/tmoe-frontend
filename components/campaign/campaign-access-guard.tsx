"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"

const allowed = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.BRAND,
  UserRole.PUBLISHER,
])

export function CampaignAccessGuard({
  children,
}: {
  children: ReactNode
}) {
  const { role, isReady } = useDashboardUserRole()

  if (!isReady) {
    return <LoadingSkeleton variant="card-grid" cardCount={4} />
  }

  if (!role || !allowed.has(role)) {
    return (
      <div className="animate-in fade-in-0 zoom-in-95 fill-mode-both duration-300 mx-auto max-w-md rounded-xl border border-border/80 bg-card p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">
          Campaigns are restricted
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          This area is available to brand, publisher, and admin accounts only.
        </p>
        <Button asChild className="mt-6">
          <Link href="/insights">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
