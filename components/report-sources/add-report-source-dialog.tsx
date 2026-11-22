"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  fetchPromoteLinkBrands,
  promoteLinkBrandsQueryKey,
} from "@/lib/api/promote-links"
import {
  createReportSource,
  reportSourcesQueryKey,
} from "@/lib/api/report-sources"
import type { ReportSource } from "@/lib/report-source.types"

type AddReportSourceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful import, so the caller can navigate to the new sheet. */
  onCreated?: (source: ReportSource) => void
}

export function AddReportSourceDialog({
  open,
  onOpenChange,
  onCreated,
}: AddReportSourceDialogProps) {
  const queryClient = useQueryClient()
  const [sheetUrl, setSheetUrl] = useState("")
  const [brandId, setBrandId] = useState("")
  const [name, setName] = useState("")
  const [allTabs, setAllTabs] = useState(false)

  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: promoteLinkBrandsQueryKey,
    queryFn: fetchPromoteLinkBrands,
    enabled: open,
  })

  const reset = () => {
    setSheetUrl("")
    setBrandId("")
    setName("")
    setAllTabs(false)
  }

  const addSheet = useMutation({
    mutationFn: () =>
      createReportSource({
        sheet_url: sheetUrl.trim(),
        brand_profile_id: brandId,
        name: name.trim() || undefined,
        all_tabs: allTabs || undefined,
      }),
    onSuccess: (source) => {
      queryClient.invalidateQueries({ queryKey: reportSourcesQueryKey })
      if (source.all_tabs) {
        const tabCount = source.tabs?.length ?? 0
        toast.success(
          `Imported ${tabCount} ${tabCount === 1 ? "tab" : "tabs"} and ${source.row_count} rows from ${source.name}`,
        )
      } else {
        toast.success(`Imported ${source.row_count} rows from ${source.name}`)
      }
      reset()
      onOpenChange(false)
      onCreated?.(source)
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const message = error.response?.data?.message
      toast.error(
        (Array.isArray(message) ? message[0] : message) ??
          "Could not add this sheet",
      )
    },
  })

  const canSubmit =
    sheetUrl.trim() !== "" && brandId !== "" && !addSheet.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (addSheet.isPending) return
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a reporting sheet</DialogTitle>
          <DialogDescription>
            Paste the link to a Google Sheet tab and pick the brand it reports
            on. The rows are imported straight away, then refreshed every few
            hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-sheet-url">Google Sheet URL</Label>
            <Input
              id="report-sheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
              value={sheetUrl}
              onChange={(event) => setSheetUrl(event.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Share the sheet as &ldquo;Anyone with the link&rdquo; first.{" "}
              {allTabs ? (
                "Any tab's URL works."
              ) : (
                <>
                  Open the tab you want before copying the URL, because the tab
                  is read from the <span className="font-mono">#gid=</span> at
                  the end.
                </>
              )}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="report-sheet-all-tabs"
              className="mt-0.5"
              checked={allTabs}
              onCheckedChange={(checked) => setAllTabs(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="report-sheet-all-tabs">Import every tab</Label>
              <p className="text-xs text-muted-foreground">
                For spreadsheets with a tab per month. Every tab is imported,
                and new tabs are picked up on each sync.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              value={brandId}
              onValueChange={setBrandId}
              disabled={brandsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    brandsLoading ? "Loading brands…" : "Select a brand"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.brand_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-sheet-name">Name (optional)</Label>
            <Input
              id="report-sheet-name"
              placeholder={
                allTabs
                  ? "Defaults to the spreadsheet's name"
                  : "Defaults to the sheet and tab name"
              }
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!canSubmit}
            onClick={() => addSheet.mutate()}
          >
            {addSheet.isPending
              ? allTabs
                ? "Reading every tab…"
                : "Reading the sheet…"
              : "Add sheet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
