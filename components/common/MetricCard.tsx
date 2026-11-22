import * as React from "react"

import { cn } from "@/lib/utils"

type MetricCardProps = {
  label: string
  value: string | number
  sublabel?: string
  trend?: string
  trendVariant?: "default" | "positive" | "negative" | "muted"
  alert?: boolean
  className?: string
}

export function MetricCard({
  label,
  value,
  sublabel,
  trend,
  trendVariant = "muted",
  alert = false,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5",
        className
      )}
    >
      {alert ? (
        <span className="absolute top-4 right-4 size-2 rounded-full bg-primary" />
      ) : null}

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {sublabel ? (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        ) : null}
      </div>

      {trend ? (
        <p
          className={cn(
            "text-xs font-medium",
            trendVariant === "positive" && "text-emerald-600",
            trendVariant === "negative" && "text-primary",
            trendVariant === "muted" && "text-muted-foreground",
            trendVariant === "default" && "text-foreground"
          )}
        >
          {trend}
        </p>
      ) : null}
    </div>
  )
}
