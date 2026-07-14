"use client"

import {
  AlignCenter,
  ArrowDownToLine,
  Check,
  FileText,
  Grid3x3,
  LayoutTemplate,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Sidebar,
  type LucideIcon,
} from "lucide-react"

import { PlacementVisualizer } from "@/components/content-placement/placement-visualizer"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  CONTENT_PLACEMENT_POSITIONS,
  getPlacementLabel,
  type ContentPlacementPosition,
} from "@/lib/content-placement.types"

type PlacementPickerProps = {
  value: ContentPlacementPosition | null | undefined
  onChange: (position: ContentPlacementPosition) => void
  disabled?: boolean
}

const POSITION_ICONS: Record<ContentPlacementPosition, LucideIcon> = {
  HERO: LayoutTemplate,
  LEFT: PanelLeft,
  RIGHT: PanelRight,
  CENTER: AlignCenter,
  FIRST_SCROLL: ArrowDownToLine,
  IN_ARTICLE: FileText,
  SIDEBAR: Sidebar,
  CATEGORY_PAGE: Grid3x3,
  FOOTER: PanelBottom,
}

export function PlacementPicker({ value, onChange, disabled }: PlacementPickerProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(340px,44%)_minmax(0,1fr)] lg:items-start xl:gap-8">
      {/* Live preview — prominent left column */}
      <div className="lg:sticky lg:top-6">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-card via-card to-primary/8 p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Live preview</p>
              <p className="text-muted-foreground text-xs">
                Highlighted zone is where content will appear
              </p>
            </div>
            <Badge variant={value ? "default" : "secondary"}>
              {value ? getPlacementLabel(value) : "None selected"}
            </Badge>
          </div>
          <PlacementVisualizer position={value} emphasized size="lg" />
        </div>
      </div>

      {/* Position options — scrollable list */}
      <div className="min-w-0">
        <p className="mb-3 text-sm font-semibold">Choose position</p>
        <div
          className="grid max-h-[min(72vh,640px)] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
          role="radiogroup"
          aria-label="Content placement position"
        >
          {CONTENT_PLACEMENT_POSITIONS.map((option) => {
            const selected = value === option.value
            const Icon = POSITION_ICONS[option.value]

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onChange(option.value)}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary/25"
                    : "border-border/80 bg-card hover:border-primary/35 hover:bg-muted/30",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    selected
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-muted/50 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug font-medium">{option.label}</p>
                    {selected ? (
                      <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
