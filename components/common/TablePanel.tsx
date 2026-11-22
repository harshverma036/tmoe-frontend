import * as React from "react"

import { cn } from "@/lib/utils"

type TablePanelProps = {
  toolbar?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function TablePanel({
  toolbar,
  footer,
  children,
  className,
}: TablePanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs",
        className,
      )}
    >
      {toolbar ? (
        <div className="border-b border-border/70 p-4 sm:p-5">{toolbar}</div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
      {footer ? (
        <div className="border-t border-border/70 px-4 py-3 sm:px-5">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
