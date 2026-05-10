import * as React from "react"

import { Card, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Single placeholder card — matches dashboard card lists (accent rail + header body). */
function LoadingSkeletonCard({ className }: { className?: string }) {
  return (
    <Card
      size="sm"
      className={cn(
        "gap-0 overflow-hidden border-border/80 py-0",
        "shadow-md shadow-black/6 ring-1 ring-black/4 dark:shadow-black/25 dark:ring-white/6",
        className
      )}
    >
      <div className="flex">
        <Skeleton
          className="w-1 shrink-0 self-stretch rounded-none min-h-[132px]"
          aria-hidden
        />
        <CardHeader className="min-w-0 flex-1 space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="size-8 shrink-0 rounded-md" />
          </div>
          <Skeleton className="h-6 w-full max-w-[220px]" />
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-full max-w-[280px]" />
        </CardHeader>
      </div>
    </Card>
  )
}

export type LoadingSkeletonProps = {
  /** Layout preset: generic blocks vs responsive card grid (same breakpoints as slot cards). */
  variant?: "default" | "card-grid"
  /** Number of placeholder cards when `variant` is `card-grid`. */
  cardCount?: number
  className?: string
  /** Accessible label; defaults to a generic loading message. */
  label?: string
}

/**
 * Universal loading placeholder built on shadcn `Skeleton`.
 * Use `card-grid` for list pages that render a responsive grid of cards.
 */
export function LoadingSkeleton({
  variant = "default",
  cardCount = 6,
  className,
  label = "Loading…",
}: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(className)}
    >
      <span className="sr-only">{label}</span>
      {variant === "card-grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: cardCount }, (_, i) => (
            <LoadingSkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-9 w-44 max-w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[78%]" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
      )}
    </div>
  )
}

export { LoadingSkeletonCard }
