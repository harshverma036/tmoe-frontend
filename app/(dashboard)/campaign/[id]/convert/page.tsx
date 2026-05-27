"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"

import { AdminCampaignWizard } from "@/components/campaign/admin-campaign-wizard"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { campaignQueryKey, fetchCampaignById } from "@/lib/api/campaign"

export default function ConvertBriefPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: campaign, isLoading } = useQuery({
    queryKey: campaignQueryKey(id),
    queryFn: () => fetchCampaignById(id),
  })

  if (isLoading) return <LoadingSkeleton variant="default" />
  if (!campaign) return <p className="text-muted-foreground text-sm">Campaign not found.</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Convert brief to campaign</h1>
        <p className="text-muted-foreground text-sm">
          Pre-filled from approved brief: {campaign.name}
        </p>
      </div>
      <AdminCampaignWizard brief={campaign} />
    </div>
  )
}
