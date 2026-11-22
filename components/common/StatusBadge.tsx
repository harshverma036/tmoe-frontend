import { cn } from "@/lib/utils"

type StatusBadgeVariant =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "muted"
  | "default"

type StatusBadgeProps = {
  label: string
  variant?: StatusBadgeVariant
  className?: string
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  muted: "border-border bg-muted/60 text-muted-foreground",
  default: "border-primary/20 bg-primary/10 text-primary",
}

const dotStyles: Record<StatusBadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  danger: "bg-red-500",
  muted: "bg-muted-foreground",
  default: "bg-primary",
}

export function StatusBadge({
  label,
  variant = "default",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        variantStyles[variant],
        className,
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", dotStyles[variant])}
        aria-hidden
      />
      {label}
    </span>
  )
}
