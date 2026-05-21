"use client"

import { useParams } from "next/navigation"

import { CampaignAccessGuard } from "@/components/campaign/campaign-access-guard"
import { CampaignDetailClient } from "@/components/campaign/campaign-detail-client"

export default function CampaignDetailPage() {
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : ""

  return (
    <CampaignAccessGuard>
      {id ? <CampaignDetailClient id={id} /> : null}
    </CampaignAccessGuard>
  )
}
