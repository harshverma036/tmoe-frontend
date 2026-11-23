"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ContentDeliverable } from "@/lib/api/deliverables"

export const ALL_PUBLISHERS = "all"
/** Deliverables not tied to a publisher. */
export const NO_PUBLISHER = "none"

export type DeliverableFilters = {
  publisher: string
}

export const EMPTY_DELIVERABLE_FILTERS: DeliverableFilters = {
  publisher: ALL_PUBLISHERS,
}

function publisherName(d: ContentDeliverable) {
  return d.publisher_profile?.publication_name ?? d.publisher_profile?.user?.name ?? null
}

/** Publishers on the list, by name, with how many deliverables each has. */
export function deliverablePublishers(items: ContentDeliverable[]) {
  const byId = new Map<string, { id: string; name: string; count: number }>()
  for (const d of items) {
    const id = d.publisher_profile_id ?? NO_PUBLISHER
    const entry = byId.get(id) ?? {
      id,
      name: d.publisher_profile_id ? (publisherName(d) ?? "Unnamed publisher") : "No publisher",
      count: 0,
    }
    entry.count += 1
    byId.set(id, entry)
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Deliverables of the picked publisher, or all of them. */
export function filterDeliverables(items: ContentDeliverable[], filters: DeliverableFilters) {
  if (filters.publisher === ALL_PUBLISHERS) return items
  return items.filter((d) => (d.publisher_profile_id ?? NO_PUBLISHER) === filters.publisher)
}

/**
 * Publisher filter for a campaign's content list. It lists only the publishers that have
 * articles on the campaign, with how many each has.
 */
export function DeliverablesFilterBar({
  items,
  filters,
  onChange,
  shown,
}: {
  items: ContentDeliverable[]
  filters: DeliverableFilters
  onChange: (filters: DeliverableFilters) => void
  /** How many deliverables match. */
  shown: number
}) {
  const publishers = deliverablePublishers(items)
  const active = filters.publisher !== ALL_PUBLISHERS

  return (
    <div className="bg-muted/30 space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="deliverable-publisher">Publisher</Label>
          <Select
            value={filters.publisher}
            onValueChange={(publisher) => onChange({ ...filters, publisher })}
          >
            <SelectTrigger id="deliverable-publisher" className="h-9 w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PUBLISHERS}>All publishers ({items.length})</SelectItem>
              {publishers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {active ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => onChange(EMPTY_DELIVERABLE_FILTERS)}
          >
            <X className="size-4" />
            Clear filter
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        Showing {shown} of {items.length} articles.
      </p>
    </div>
  )
}
