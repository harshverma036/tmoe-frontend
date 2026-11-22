"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createPublisherProperty,
  promoteLinkPropertiesQueryKey,
} from "@/lib/api/promote-links"

type AddPropertyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPropertyDialog({ open, onOpenChange }: AddPropertyDialogProps) {
  const queryClient = useQueryClient()
  const [propertyId, setPropertyId] = useState("")
  const [name, setName] = useState("")

  const saveProperty = useMutation({
    mutationFn: createPublisherProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoteLinkPropertiesQueryKey() })
      toast.success("Property saved")
      setPropertyId("")
      setName("")
      onOpenChange(false)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not save property")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add promotional property</DialogTitle>
          <DialogDescription>
            Register an Impact.com media property ID (website, app, or channel) for link attribution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="impact-property-id">Impact property ID</Label>
            <Input
              id="impact-property-id"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="From your Impact.com dashboard"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="impact-property-name">Display name</Label>
            <Input
              id="impact-property-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main blog"
            />
          </div>
          <Button
            type="button"
            disabled={!propertyId.trim() || !name.trim() || saveProperty.isPending}
            onClick={() =>
              saveProperty.mutate({
                impact_property_id: propertyId.trim(),
                name: name.trim(),
              })
            }
          >
            {saveProperty.isPending ? "Saving…" : "Save property"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
