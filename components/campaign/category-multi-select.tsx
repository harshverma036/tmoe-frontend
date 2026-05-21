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
import { Label } from "@/components/ui/label"
import { mergeCategoryOptionsWithSelection } from "@/lib/campaign-target-categories"
import { cn } from "@/lib/utils"

type CategoryMultiSelectProps = {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  error?: string
  disabled?: boolean
}

export function CategoryMultiSelect({
  id = "target-category",
  value,
  onChange,
  error,
  disabled,
}: CategoryMultiSelectProps) {
  const options = mergeCategoryOptionsWithSelection(value)

  function toggle(cat: string, checked: boolean) {
    if (checked) {
      if (value.includes(cat)) return
      onChange([...value, cat])
    } else {
      onChange(value.filter((v) => v !== cat))
    }
  }

  function remove(cat: string) {
    onChange(value.filter((v) => v !== cat))
  }

  return (
    <div className="grid w-full gap-2">
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        Target categories
      </Label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            className={cn(
              "h-auto min-h-9 w-full justify-between gap-2 py-2 text-left font-normal",
              error && "border-destructive",
            )}
          >
            <span className="line-clamp-2 text-muted-foreground">
              {value.length
                ? `${value.length} selected — add or remove in the list`
                : "Choose one or more categories"}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-64 w-[min(100vw-2rem,var(--radix-dropdown-menu-trigger-width))] min-w-56 overflow-y-auto"
        >
          {options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt}
              checked={value.includes(opt)}
              onCheckedChange={(c) => toggle(opt, Boolean(c))}
              onSelect={(e) => e.preventDefault()}
            >
              {opt}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {value.length > 0 ? (
        <ul
          className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/20 p-3"
          aria-label="Selected categories"
        >
          {value.map((cat) => (
            <li key={cat}>
              <Badge
                variant="secondary"
                className="gap-1 pr-1 font-normal tabular-nums"
              >
                {cat}
                <button
                  type="button"
                  className="hover:bg-secondary-foreground/15 rounded-sm p-0.5 outline-none ring-ring focus-visible:ring-2"
                  onClick={() => remove(cat)}
                  aria-label={`Remove ${cat}`}
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
