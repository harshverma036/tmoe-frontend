"use client"

import { cn } from "@/lib/utils"
import type { ContentPlacementPosition } from "@/lib/content-placement.types"

type PlacementVisualizerProps = {
  position: ContentPlacementPosition | null | undefined
  className?: string
  /** Highlight the active zone more prominently (e.g. in picker). */
  emphasized?: boolean
  size?: "sm" | "lg"
}

const ZONE_CLASS =
  "relative rounded-md border border-dashed transition-all duration-300"

function zoneClass(active: boolean, emphasized?: boolean) {
  return cn(
    ZONE_CLASS,
    active
      ? emphasized
        ? "border-primary bg-primary/25 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)] ring-2 ring-primary/35"
        : "border-primary bg-primary/15"
      : "border-muted-foreground/20 bg-muted/30",
  )
}

function ActiveBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="bg-primary text-primary-foreground absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-sm sm:text-xs">
      Your content
    </span>
  )
}

/**
 * Mock page layout — highlights where branded content would appear.
 */
export function PlacementVisualizer({
  position,
  className,
  emphasized = false,
  size = "sm",
}: PlacementVisualizerProps) {
  const p = position ?? null
  const isLg = size === "lg"

  return (
    <div
      className={cn(
        "bg-background flex w-full flex-col overflow-hidden rounded-2xl border border-border/80 shadow-md",
        isLg ? "min-h-[min(72vh,560px)]" : "aspect-[4/3] max-w-md",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "bg-muted/70 flex shrink-0 items-center gap-1.5 border-b",
          isLg ? "h-9 px-3" : "h-7 px-2",
        )}
      >
        <span className="bg-muted-foreground/35 size-2 rounded-full" />
        <span className="bg-muted-foreground/35 size-2 rounded-full" />
        <span className="bg-muted-foreground/35 size-2 rounded-full" />
        <span
          className={cn(
            "text-muted-foreground ml-1 truncate font-medium",
            isLg ? "text-xs" : "text-[10px]",
          )}
        >
          publisher-site.com
        </span>
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col", isLg ? "gap-3 p-4" : "gap-2 p-2")}>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center font-medium",
            isLg ? "h-14 text-sm" : "h-9 text-[10px]",
            zoneClass(p === "HERO", emphasized),
          )}
        >
          <ActiveBadge show={p === "HERO" && emphasized} />
          <span className={cn(p === "HERO" && emphasized && "opacity-40")}>Hero banner</span>
        </div>

        <div className={cn("flex min-h-0 flex-1", isLg ? "gap-3" : "gap-2")}>
          <div
            className={cn(
              "flex w-[24%] shrink-0 items-center justify-center text-center font-medium",
              isLg ? "text-xs" : "text-[9px]",
              zoneClass(p === "LEFT" || p === "SIDEBAR", emphasized),
            )}
          >
            <ActiveBadge show={(p === "LEFT" || p === "SIDEBAR") && emphasized} />
            <span className={cn((p === "LEFT" || p === "SIDEBAR") && emphasized && "opacity-40")}>
              {p === "SIDEBAR" ? "Sidebar" : "Left rail"}
            </span>
          </div>

          <div className={cn("flex min-w-0 flex-1 flex-col", isLg ? "gap-3" : "gap-1.5")}>
            <div
              className={cn(
                "relative flex flex-1 flex-col justify-center gap-2 p-3",
                isLg ? "min-h-[140px]" : "",
                zoneClass(p === "CENTER" || p === "IN_ARTICLE", emphasized),
              )}
            >
              <ActiveBadge show={(p === "CENTER" || p === "IN_ARTICLE") && emphasized} />
              <div
                className={cn(
                  "space-y-1.5",
                  (p === "CENTER" || p === "IN_ARTICLE") && emphasized && "opacity-35",
                )}
              >
                <div className={cn("bg-muted rounded-full", isLg ? "h-2 w-4/5" : "h-1.5 w-3/4")} />
                <div className={cn("bg-muted rounded-full", isLg ? "h-1.5 w-full" : "h-1 w-full")} />
                <div className={cn("bg-muted rounded-full", isLg ? "h-1.5 w-11/12" : "h-1 w-5/6")} />
              </div>
              {p === "IN_ARTICLE" && (
                <div
                  className={cn(
                    "border-primary bg-primary/30 flex items-center justify-center rounded-md border font-semibold",
                    isLg ? "mx-4 h-10 text-xs" : "mx-2 h-7 text-[8px]",
                  )}
                >
                  In-article block
                </div>
              )}
              <div
                className={cn(
                  "space-y-1.5",
                  (p === "CENTER" || p === "IN_ARTICLE") && emphasized && "opacity-35",
                )}
              >
                <div className={cn("bg-muted rounded-full", isLg ? "h-1.5 w-full" : "h-1 w-full")} />
                <div className={cn("bg-muted rounded-full", isLg ? "h-1.5 w-2/3" : "h-1 w-2/3")} />
              </div>
            </div>

            <div
              className={cn(
                "flex shrink-0 items-center justify-center font-medium",
                isLg ? "h-12 text-xs" : "h-8 text-[9px]",
                zoneClass(p === "FIRST_SCROLL", emphasized),
              )}
            >
              <ActiveBadge show={p === "FIRST_SCROLL" && emphasized} />
              <span className={cn(p === "FIRST_SCROLL" && emphasized && "opacity-40")}>
                First scroll zone
              </span>
            </div>

            <div
              className={cn(
                "grid shrink-0 grid-cols-3 gap-1.5 p-1.5",
                isLg ? "h-14" : "h-10",
                zoneClass(p === "CATEGORY_PAGE", emphasized),
              )}
            >
              <ActiveBadge show={p === "CATEGORY_PAGE" && emphasized} />
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={cn(
                    "bg-muted/80 rounded",
                    p === "CATEGORY_PAGE" && emphasized && "opacity-50",
                  )}
                />
              ))}
            </div>
          </div>

          <div
            className={cn(
              "flex w-[24%] shrink-0 items-center justify-center text-center font-medium",
              isLg ? "text-xs" : "text-[9px]",
              zoneClass(p === "RIGHT", emphasized),
            )}
          >
            <ActiveBadge show={p === "RIGHT" && emphasized} />
            <span className={cn(p === "RIGHT" && emphasized && "opacity-40")}>Right rail</span>
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center justify-center font-medium",
            isLg ? "h-10 text-xs" : "h-6 text-[9px]",
            zoneClass(p === "FOOTER", emphasized),
          )}
        >
          <ActiveBadge show={p === "FOOTER" && emphasized} />
          <span className={cn(p === "FOOTER" && emphasized && "opacity-40")}>Footer strip</span>
        </div>
      </div>
    </div>
  )
}
