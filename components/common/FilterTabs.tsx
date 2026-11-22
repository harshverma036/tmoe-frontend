"use client"

import { cn } from "@/lib/utils"

export type FilterTab<T extends string = string> = {
  value: T
  label: string
  count?: number
}

type FilterTabsProps<T extends string> = {
  tabs: FilterTab<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  /** Names the strip for screen readers (e.g. "Report"). */
  label?: string
  /** The id of a visible element that names the strip; used instead of `label`. */
  labelledBy?: string
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  label,
  labelledBy,
}: FilterTabsProps<T>) {
  const isLabelled = label !== undefined || labelledBy !== undefined
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1", className)}
      role={isLabelled ? "group" : undefined}
      aria-label={labelledBy === undefined ? label : undefined}
      aria-labelledby={labelledBy}
    >
      {tabs.map((tab) => {
        const isActive = value === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "tabular-nums",
                  isActive ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                {formatCount(tab.count)}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
