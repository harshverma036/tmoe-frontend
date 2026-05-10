import * as React from "react"

import { cn } from "@/lib/utils"

type SettingsCardProps = {
  id: string
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * Consistent bordered card for account settings sections.
 */
export function SettingsCard({ id, title, children, className }: SettingsCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-lg border border-border/80 bg-card/30 p-6 shadow-sm",
        className
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}
