"use client"

import { ChevronDown, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { PublisherSearchResult } from "@/lib/api/publisher-search"

type PublisherMultiSelectProps = {
  publishers: PublisherSearchResult[]
  value: string[]
  onChange: (ids: string[]) => void
  search: string
  onSearchChange: (q: string) => void
  isLoading?: boolean
  error?: string
  disabled?: boolean
}

export function PublisherMultiSelect({
  publishers,
  value,
  onChange,
  search,
  onSearchChange,
  isLoading,
  error,
  disabled,
}: PublisherMultiSelectProps) {
  const selectedLabels = value
    .map((id) => publishers.find((p) => p.id === id))
    .filter(Boolean) as PublisherSearchResult[]

  function toggle(id: string, checked: boolean) {
    if (checked) {
      if (value.includes(id)) return
      onChange([...value, id])
    } else {
      onChange(value.filter((v) => v !== id))
    }
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id))
  }

  return (
    <div className="grid w-full gap-2">
      <Label className={cn(error && "text-destructive")}>Publishers</Label>
      <p className="text-muted-foreground text-xs">
        Select one or more verified publisher accounts from the platform.
      </p>

      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        disabled={disabled}
        aria-label="Search publishers"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isLoading}
            aria-invalid={error ? true : undefined}
            className={cn(
              "h-auto min-h-9 w-full justify-between gap-2 py-2 text-left font-normal",
              error && "border-destructive",
            )}
          >
            <span className="line-clamp-2 text-muted-foreground">
              {isLoading
                ? "Loading publishers…"
                : value.length
                  ? `${value.length} publisher(s) selected`
                  : publishers.length
                    ? "Choose publishers from the list"
                    : "No publishers found"}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-72 w-[min(100vw-2rem,var(--radix-dropdown-menu-trigger-width))] min-w-72 overflow-y-auto"
        >
          {publishers.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-center text-xs">
              No verified publisher accounts match your search.
            </p>
          ) : (
            publishers.map((p) => (
              <DropdownMenuCheckboxItem
                key={p.id}
                checked={value.includes(p.id)}
                onCheckedChange={(c) => toggle(p.id, Boolean(c))}
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {p.user?.email ?? ""}
                    {p.categories?.length
                      ? ` · ${p.categories.slice(0, 2).join(", ")}`
                      : ""}
                  </span>
                </span>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedLabels.length > 0 ? (
        <ul
          className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/20 p-3"
          aria-label="Selected publishers"
        >
          {selectedLabels.map((p) => (
            <li key={p.id}>
              <Badge variant="secondary" className="gap-1 pr-1 font-normal">
                {p.name}
                <button
                  type="button"
                  className="hover:bg-secondary-foreground/15 rounded-sm p-0.5 outline-none ring-ring focus-visible:ring-2"
                  onClick={() => remove(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  <X className="size-3 opacity-70" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="text-destructive text-xs font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
