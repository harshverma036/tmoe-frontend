"use client"

import { useState } from "react"
import { ChevronDown, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * What the report fixed or left out while reading the sheet (swapped dates, rows entered twice,
 * a missing Dollar rate). Collapsed by default: the figures already account for all of it.
 */
export function ReportWarningsCard({ warnings }: { warnings: string[] }) {
  const [open, setOpen] = useState(false)

  if (warnings.length === 0) return null

  return (
    <Card size="sm" className="ring-amber-300/70">
      <CardHeader>
        {/* No count in the title: past 50 the API ends the list with "N more …", so the length
            of `warnings` is not the number of problems. */}
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="size-4 shrink-0 text-amber-600" aria-hidden />
          Notes on this report
        </CardTitle>
        <CardDescription>
          Rows the report fixed, counted once or left out, and settings it needs.
          Correct them in the Google Sheet or on Report Sources to clear these.
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? "Hide" : "Show"}
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
            />
          </Button>
        </CardAction>
      </CardHeader>
      {open ? (
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  )
}
