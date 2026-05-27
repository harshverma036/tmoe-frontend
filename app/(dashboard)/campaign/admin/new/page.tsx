"use client"

import { AdminCampaignWizard } from "@/components/campaign/admin-campaign-wizard"

export default function AdminNewCampaignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create campaign</h1>
        <p className="text-muted-foreground text-sm">
          Build a full campaign with publishers, budgets, and ROI estimates.
        </p>
      </div>
      <AdminCampaignWizard />
    </div>
  )
}
