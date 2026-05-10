"use client"

import { format, parseISO } from "date-fns"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"

import type { ContentSlot } from "@/lib/validation/content-slot-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type ContentSlotCardProps = {
  slot: ContentSlot
  onEdit: () => void
  onDelete: () => void
}

/** Short date for compact metadata (shown under traffic, same block). */
function shortDate(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy")
  } catch {
    return iso
  }
}

/**
 * Slot card: badges + overflow menu (top-right), category, traffic, then timestamps
 * directly under traffic — no separate footer strip for dates or actions.
 */
export function ContentSlotCard({
  slot,
  onEdit,
  onDelete,
}: ContentSlotCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "gap-0 overflow-hidden border-border/80 py-0",
        "shadow-md shadow-black/6 ring-1 ring-black/4 dark:shadow-black/25 dark:ring-white/6",
        "transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/35"
      )}
    >
      <div className="flex">
        <div
          className="w-1 shrink-0 bg-linear-to-b from-primary/90 to-primary/50"
          aria-hidden
        />
        <CardHeader className="min-w-0 flex-1 space-y-2.5 p-4">
          {/* Top row: badges + actions menu (see shadcn Dropdown Menu docs) */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="font-normal">
                {slot.type}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {slot.monetisation_model}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Slot actions"
                >
                  <MoreVertical className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem className="gap-2" onSelect={() => onEdit()}>
                  <Pencil className="size-4 opacity-70" aria-hidden />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2"
                  onSelect={() => onDelete()}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardTitle className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight">
            {slot.category}
          </CardTitle>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {slot.estimated_traffic.toLocaleString()}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              est. traffic
            </span>
          </div>

          {/* Timestamps sit under traffic in the same section (no extra card region) */}
          <p className="text-muted-foreground text-[11px] leading-relaxed tabular-nums">
            <span className="font-medium text-foreground/80">Created</span>{" "}
            {shortDate(slot.createdAt)}
            <span className="mx-1.5 text-muted-foreground/60">·</span>
            <span className="font-medium text-foreground/80">Updated</span>{" "}
            {shortDate(slot.updatedAt)}
          </p>
        </CardHeader>
      </div>
    </Card>
  )
}
