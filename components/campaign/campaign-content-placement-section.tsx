"use client"

import { PlacementVisualizer } from "@/components/content-placement/placement-visualizer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getPlacementLabel,
  type ContentPlacement,
} from "@/lib/content-placement.types"

type CampaignContentPlacementSectionProps = {
  placement: ContentPlacement | null | undefined
}

export function CampaignContentPlacementSection({
  placement,
}: CampaignContentPlacementSectionProps) {
  if (!placement) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">No content placement selected</CardTitle>
          <p className="text-muted-foreground text-sm">
            The brand did not choose a content placement when creating this campaign
            brief.
          </p>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{placement.name}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {getPlacementLabel(placement.position)}
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {placement.description ? (
            <p className="text-muted-foreground">{placement.description}</p>
          ) : (
            <p className="text-muted-foreground">
              Branded content for this campaign is intended for the{" "}
              <span className="text-foreground font-medium">
                {getPlacementLabel(placement.position).toLowerCase()}
              </span>{" "}
              zone on publisher sites.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Placement preview
        </p>
        <PlacementVisualizer position={placement.position} emphasized />
      </div>
    </div>
  )
}
