"use client"

import { useCallback, useState } from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type SkuTagInputProps = {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  label?: string
}

export function SkuTagInput({
  id = "product-skus",
  value,
  onChange,
  error,
  disabled,
  placeholder = "Type a SKU or product name, then press Enter",
  label = "Product SKUs",
}: SkuTagInputProps) {
  const [draft, setDraft] = useState("")

  const commitDraft = useCallback(() => {
    const next = draft.trim()
    if (!next) return
    if (value.includes(next)) {
      setDraft("")
      return
    }
    onChange([...value, next])
    setDraft("")
  }, [draft, onChange, value])

  function remove(sku: string) {
    onChange(value.filter((v) => v !== sku))
  }

  return (
    <div className="grid w-full gap-2">
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <div
        className={cn(
          "flex min-h-11 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-2 py-2 shadow-xs transition-[color,box-shadow] outline-none",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          error && "border-destructive ring-destructive/20",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {value.map((sku) => (
          <Badge
            key={sku}
            variant="secondary"
            className="max-w-full gap-1 truncate py-1 pr-1 font-normal"
          >
            <span className="truncate">{sku}</span>
            <button
              type="button"
              className="hover:bg-secondary-foreground/15 shrink-0 rounded-sm p-0.5 outline-none ring-ring focus-visible:ring-2"
              onClick={() => remove(sku)}
              aria-label={`Remove ${sku}`}
            >
              <X className="size-3 opacity-70" />
            </button>
          </Badge>
        ))}
        <input
          id={id}
          type="text"
          disabled={disabled}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitDraft()
            }
          }}
          placeholder={value.length === 0 ? placeholder : "Add another…"}
          className="placeholder:text-muted-foreground min-w-[min(100%,12rem)] flex-1 border-0 bg-transparent py-0.5 text-sm outline-none disabled:cursor-not-allowed"
          aria-invalid={error ? true : undefined}
        />
      </div>
      {error ? (
        <p className="text-destructive text-xs font-medium" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Press <kbd className="rounded border px-1 py-px font-mono text-[10px]">Enter</kbd>{" "}
          after each entry to add a tag.
        </p>
      )}
    </div>
  )
}
