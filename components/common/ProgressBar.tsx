import { cn } from "@/lib/utils"

type ProgressBarVariant = "success" | "warning" | "info" | "danger" | "muted"

type ProgressBarProps = {
  value: number
  max?: number
  variant?: ProgressBarVariant
  className?: string
}

const fillStyles: Record<ProgressBarVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  danger: "bg-red-500",
  muted: "bg-muted-foreground/50",
}

export function ProgressBar({
  value,
  max = 100,
  variant = "info",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0

  return (
    <div className={cn("flex min-w-[72px] items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", fillStyles[variant])}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {percent}%
      </span>
    </div>
  )
}
