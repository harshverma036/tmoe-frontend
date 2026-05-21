"use client"

import { Plus, Trash2 } from "lucide-react"
import {
  type Control,
  type FieldArrayPath,
  type UseFormRegister,
  useFieldArray,
} from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CampaignBriefFormValues } from "@/lib/validation/campaign-brief-form"
import { cn } from "@/lib/utils"

type RepeatableFieldName = FieldArrayPath<CampaignBriefFormValues>

type RepeatableTextListProps = {
  control: Control<CampaignBriefFormValues>
  register: UseFormRegister<CampaignBriefFormValues>
  name: RepeatableFieldName
  label: string
  addButtonLabel: string
  placeholder?: string
  error?: string
  /** Wider link rows: input stretches to full row width. */
  fullWidthRows?: boolean
}

/**
 * Vertical list of text inputs with add/remove — used for categories, SKUs, and links.
 */
export function RepeatableTextList({
  control,
  register,
  name,
  label,
  addButtonLabel,
  placeholder,
  error,
  fullWidthRows,
}: RepeatableTextListProps) {
  const { fields, append, remove } = useFieldArray<CampaignBriefFormValues>({
    control,
    name,
  })

  return (
    <div className={cn("grid gap-2", fullWidthRows && "w-full")}>
      <div
        className={cn(
          "flex gap-2",
          fullWidthRows
            ? "w-full flex-col items-stretch sm:flex-row sm:items-end"
            : "items-end justify-between",
        )}
      >
        <Label className={cn(error && "text-destructive")}>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("shrink-0", fullWidthRows && "w-full sm:ml-auto sm:w-auto")}
          onClick={() => append("")}
        >
          <Plus className="size-4" aria-hidden />
          {addButtonLabel}
        </Button>
      </div>
      <ul className={cn("grid gap-2", fullWidthRows && "w-full")}>
        {fields.map((field, index) => (
          <li
            key={field.id}
            className={cn(
              "flex gap-2",
              fullWidthRows && "w-full min-w-0 items-stretch",
            )}
          >
            <Input
              placeholder={placeholder}
              className={cn(
                "min-w-0",
                fullWidthRows ? "w-full flex-1" : "flex-1",
              )}
              aria-invalid={error ? true : undefined}
              {...register(`${name}.${index}`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "shrink-0 text-muted-foreground hover:text-destructive",
                fullWidthRows && "self-start sm:self-center",
              )}
              disabled={fields.length <= 1}
              onClick={() => remove(index)}
              aria-label={`Remove row ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      {error ? (
        <p className="text-destructive text-xs font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
