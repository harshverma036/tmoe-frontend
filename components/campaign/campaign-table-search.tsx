"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

type CampaignTableSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CampaignTableSearch({
  value,
  onChange,
  placeholder = "Search campaigns…",
}: CampaignTableSearchProps) {
  return (
    <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search campaigns"
        className="h-10 rounded-xl border-border/80 bg-muted/30 pl-9 shadow-none"
      />
    </div>
  )
}
