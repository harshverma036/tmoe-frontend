"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { PlacementVisualizer } from "@/components/content-placement/placement-visualizer"
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  contentPlacementsQueryKey,
  fetchContentPlacements,
} from "@/lib/api/content-placements"
import {
  getPlacementLabel,
  isPlacementConfigured,
  type ContentPlacement,
} from "@/lib/content-placement.types"

type ContentPlacementSelectFieldProps = {
  value: string
  onChange: (placementId: string) => void
  disabled?: boolean
  label?: string
  hint?: string
  error?: string
}

export function ContentPlacementSelectField({
  value,
  onChange,
  disabled,
  label = "Content placement",
  hint = "Choose where branded content should appear on publisher sites.",
  error,
}: ContentPlacementSelectFieldProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: contentPlacementsQueryKey,
    queryFn: () => fetchContentPlacements({ limit: 200 }),
  })

  const configured = useMemo(
    () => (data?.items ?? []).filter(isPlacementConfigured),
    [data?.items],
  )

  const selected: ContentPlacement | undefined = useMemo(() => {
    if (!value) return undefined
    return configured.find((p) => p.id === value)
  }, [configured, value])

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>{label}</Label>
        {isLoading ? (
          <LoadingSkeleton variant="default" className="h-10" />
        ) : isError ? (
          <p className="text-destructive text-sm">
            Could not load content placements. Try again later.
          </p>
        ) : configured.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No configured content placements yet. Ask your TMOE admin to set one up.
          </p>
        ) : (
          <Select
            value={value || undefined}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select content placement" />
            </SelectTrigger>
            <SelectContent>
              {configured.map((placement) => (
                <SelectItem key={placement.id} value={placement.id}>
                  {placement.name} — {getPlacementLabel(placement.position)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </div>

      {selected ? (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(200px,280px)] sm:items-start">
          <div className="rounded-xl border border-border/80 bg-card/80 p-4">
            <p className="font-medium">{selected.name}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {getPlacementLabel(selected.position)}
            </p>
            {selected.description ? (
              <p className="text-muted-foreground mt-2 text-sm">{selected.description}</p>
            ) : null}
          </div>
          <PlacementVisualizer position={selected.position} />
        </div>
      ) : null}
    </div>
  )
}
