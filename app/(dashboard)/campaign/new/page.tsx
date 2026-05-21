"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"

import { CampaignAccessGuard } from "@/components/campaign/campaign-access-guard"
import { CampaignBriefForm } from "@/components/campaign/campaign-brief-form"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

function NewCampaignInner() {
  const router = useRouter()
  const { role, isReady } = useDashboardUserRole()

  if (!isReady) {
    return <LoadingSkeleton variant="default" />
  }

  if (role !== UserRole.BRAND) {
    return (
      <div className="animate-in fade-in-0 zoom-in-95 fill-mode-both duration-400 mx-auto max-w-md rounded-xl border border-border/80 bg-card p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Brand access only</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Only brand accounts can create new campaign briefs. Admins can open
          existing campaigns from the list.
        </p>
        <Button asChild className="mt-6">
          <Link href="/campaign">Back to campaigns</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in-0 duration-500 mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">New Campaign Brief</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Use <span className="font-medium text-foreground">Save draft</span> to keep
            it private, or <span className="font-medium text-foreground">Submit for review</span>{" "}
            to send it to admins.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/campaign">Cancel</Link>
        </Button>
      </div>
      <CampaignBriefForm
        mode="create"
        onSuccess={(c) => router.push(`/campaign/${c.id}`)}
      />
    </div>
  )
}

export default function NewCampaignPage() {
  return (
    <CampaignAccessGuard>
      <NewCampaignInner />
    </CampaignAccessGuard>
  )
}
