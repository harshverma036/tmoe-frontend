"use client"

import { CampaignAccessGuard } from "@/components/campaign/campaign-access-guard"
import { CampaignListClient } from "@/components/campaign/campaign-list-client"

export default function CampaignPage() {
  return (
    <CampaignAccessGuard>
      <CampaignListClient />
    </CampaignAccessGuard>
  )
}
