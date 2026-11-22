"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Copy, ExternalLink } from "lucide-react"
import { useMemo, useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createPromoteLink,
  fetchPromoteLinkBrands,
  fetchPromoteLinkProperties,
  promoteLinkBrandsQueryKey,
  promoteLinkPropertiesQueryKey,
  promoteLinksQueryKey,
  type PromoteLink,
  type PromoteLinkBrand,
} from "@/lib/api/promote-links"
import { UserRole } from "@/lib/dashboard-nav"

type CreatePromoteLinkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: UserRole
}

function brandIsReady(brand: PromoteLinkBrand) {
  return Boolean(brand.impact_program_id)
}

export function CreatePromoteLinkDialog({
  open,
  onOpenChange,
  role,
}: CreatePromoteLinkDialogProps) {
  const queryClient = useQueryClient()
  const [brandId, setBrandId] = useState("")
  const [landingPage, setLandingPage] = useState("")
  const [subId1, setSubId1] = useState("")
  const [subId2, setSubId2] = useState("")
  const [subId3, setSubId3] = useState("")
  const [sharedId, setSharedId] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [createdLink, setCreatedLink] = useState<PromoteLink | null>(null)
  const [showLink, setShowLink] = useState(true)

  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: promoteLinkBrandsQueryKey,
    queryFn: fetchPromoteLinkBrands,
    enabled: open,
  })

  const { data: properties = [] } = useQuery({
    queryKey: promoteLinkPropertiesQueryKey(),
    queryFn: () => fetchPromoteLinkProperties(),
    enabled: open,
  })

  const selectableBrands = useMemo(() => {
    if (role === UserRole.ADMIN) return brands
    return brands.filter(brandIsReady)
  }, [brands, role])

  const selectedBrand = brands.find((b) => b.id === brandId)

  const createLink = useMutation({
    mutationFn: createPromoteLink,
    onSuccess: (link) => {
      queryClient.invalidateQueries({ queryKey: promoteLinksQueryKey })
      setCreatedLink(link)
      setShowLink(true)
      toast.success("Promote link created")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not create link")
    },
  })

  const resetForm = () => {
    setBrandId("")
    setLandingPage("")
    setSubId1("")
    setSubId2("")
    setSubId3("")
    setSharedId("")
    setPropertyId("")
    setCreatedLink(null)
    setShowLink(true)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleCreate = () => {
    if (!brandId) {
      toast.error("Select a brand")
      return
    }
    if (!brandIsReady(selectedBrand!)) {
      toast.error("This brand is not configured for Impact.com yet")
      return
    }

    createLink.mutate({
      brand_profile_id: brandId,
      landing_page: landingPage.trim() || undefined,
      sub_id_1: subId1.trim() || undefined,
      sub_id_2: subId2.trim() || undefined,
      sub_id_3: subId3.trim() || undefined,
      shared_id: sharedId.trim() || undefined,
      impact_property_id: propertyId || undefined,
    })
  }

  const copyLink = async () => {
    if (!createdLink?.generated_url) return
    try {
      await navigator.clipboard.writeText(createdLink.generated_url)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy link")
    }
  }

  const displayUrl = createdLink?.generated_url.replace(/^https?:\/\//, "") ?? ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a link</DialogTitle>
          <DialogDescription>
            Promote any brand with a simple link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promote-brand">Brand</Label>
            <Select value={brandId} onValueChange={setBrandId} disabled={brandsLoading}>
              <SelectTrigger id="promote-brand" className="w-full">
                <SelectValue placeholder={brandsLoading ? "Loading…" : "Select brand"} />
              </SelectTrigger>
              <SelectContent>
                {selectableBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.brand_name}
                    {role === UserRole.ADMIN && !brandIsReady(brand)
                      ? " (not configured)"
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {role === UserRole.ADMIN && selectedBrand && !brandIsReady(selectedBrand) ? (
              <p className="text-xs text-amber-600">
                Configure this brand&apos;s Impact program ID before creating links.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="promote-landing">Landing Page</Label>
            <Input
              id="promote-landing"
              placeholder="Enter a landing page (optional)"
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="promote-sub1">Sub ID 1</Label>
              <Input
                id="promote-sub1"
                value={subId1}
                onChange={(e) => setSubId1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promote-sub2">Sub ID 2</Label>
              <Input
                id="promote-sub2"
                value={subId2}
                onChange={(e) => setSubId2(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promote-sub3">Sub ID 3</Label>
              <Input
                id="promote-sub3"
                value={subId3}
                onChange={(e) => setSubId3(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promote-shared">Shared Id</Label>
            <Input
              id="promote-shared"
              value={sharedId}
              onChange={(e) => setSharedId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promote-property">Property</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="promote-property" className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem
                    key={property.id}
                    value={property.impact_property_id}
                  >
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {properties.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add a promotional property in Settings to attribute links to a site or channel.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createLink.isPending || !brandId}
            >
              {createLink.isPending ? "Creating…" : "Create"}
            </Button>
            {createdLink ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowLink((v) => !v)}
              >
                {showLink ? "Hide" : "Show link"}
              </Button>
            ) : null}
          </div>

          {createdLink && showLink ? (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Use this link to promote {selectedBrand?.brand_name ?? "the brand"}.
                Link updates may take up to 5 minutes to propagate.
              </p>
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-md border bg-background px-2 py-1.5 text-xs text-muted-foreground">
                  https://
                </span>
                <Input
                  readOnly
                  value={displayUrl}
                  className="font-mono text-xs"
                />
                <Button type="button" size="sm" onClick={copyLink}>
                  <Copy className="mr-1 size-3.5" />
                  Copy
                </Button>
                <Button type="button" size="icon-sm" variant="outline" asChild>
                  <a
                    href={createdLink.generated_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
