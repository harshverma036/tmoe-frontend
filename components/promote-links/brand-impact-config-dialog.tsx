"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  fetchImpactCampaigns,
  fetchPromoteLinkBrands,
  impactCampaignsQueryKey,
  promoteLinkBrandsQueryKey,
  updateBrandImpactConfig,
} from "@/lib/api/promote-links"

type BrandImpactConfigDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BrandImpactConfigDialog({
  open,
  onOpenChange,
}: BrandImpactConfigDialogProps) {
  const queryClient = useQueryClient()
  const [brandId, setBrandId] = useState("")
  const [campaignId, setCampaignId] = useState("")

  const { data: brands = [] } = useQuery({
    queryKey: promoteLinkBrandsQueryKey,
    queryFn: fetchPromoteLinkBrands,
    enabled: open,
  })

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: impactCampaignsQueryKey,
    queryFn: fetchImpactCampaigns,
    enabled: open,
  })

  const saveConfig = useMutation({
    mutationFn: async () => {
      const campaign = campaigns.find((c) => c.campaignId === campaignId)
      return updateBrandImpactConfig(brandId, {
        impact_program_id: campaignId,
        impact_program_name: campaign?.campaignName ?? campaign?.advertiserName,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoteLinkBrandsQueryKey })
      toast.success("Brand Impact config saved")
      onOpenChange(false)
      setBrandId("")
      setCampaignId("")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not save config")
    },
  })

  const selectedBrand = brands.find((b) => b.id === brandId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure brand for Impact.com</DialogTitle>
          <DialogDescription>
            Map a TMOE brand to an Impact.com program so promote links can be generated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>TMOE brand</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.brand_name}
                    {brand.impact_program_id
                      ? ` (${brand.impact_program_name ?? brand.impact_program_id})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Impact.com program</Label>
            <Select
              value={campaignId}
              onValueChange={setCampaignId}
              disabled={campaignsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={campaignsLoading ? "Loading programs…" : "Select program"}
                />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.campaignId} value={campaign.campaignId}>
                    {campaign.campaignName} — {campaign.advertiserName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBrand?.impact_program_id ? (
            <p className="text-xs text-muted-foreground">
              Current program: {selectedBrand.impact_program_name ?? selectedBrand.impact_program_id}
            </p>
          ) : null}

          <Button
            type="button"
            disabled={!brandId || !campaignId || saveConfig.isPending}
            onClick={() => saveConfig.mutate()}
          >
            {saveConfig.isPending ? "Saving…" : "Save configuration"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
