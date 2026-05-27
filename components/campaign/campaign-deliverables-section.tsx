"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format, parseISO } from "date-fns"
import { CheckCircle2, Loader2, Plus } from "lucide-react"
import toast from "react-hot-toast"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  approveDeliverable,
  createDeliverable,
  deliverablesQueryKey,
  fetchDeliverables,
  needsRevisionDeliverable,
  rejectDeliverable,
  submitDeliverableUrl,
  type ContentDeliverable,
} from "@/lib/api/deliverables"
import type { Campaign } from "@/lib/campaign.types"
import { UserRole } from "@/lib/dashboard-nav"

function statusLabel(status: string) {
  return status.replace(/_/g, " ")
}

function deliverableBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "DELIVERED") return "default"
  if (status === "SUBMITTED") return "secondary"
  if (status === "REJECTED") return "destructive"
  return "outline"
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return null
  try {
    return format(parseISO(iso), "PPp")
  } catch {
    return iso
  }
}

type Props = {
  campaignId: string
  campaign: Campaign
  role: UserRole
}

export function CampaignDeliverablesSection({
  campaignId,
  campaign,
  role,
}: Props) {
  const queryClient = useQueryClient()
  const [newType, setNewType] = useState("New Article")
  const [newDesc, setNewDesc] = useState("")
  const [newPublisherId, setNewPublisherId] = useState("")
  const [urlById, setUrlById] = useState<Record<string, string>>({})
  const [reviewAction, setReviewAction] = useState<{
    id: string
    action: "reject" | "needs-revision"
  } | null>(null)
  const [reviewNote, setReviewNote] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: deliverablesQueryKey(campaignId),
    queryFn: () => fetchDeliverables(campaignId),
    enabled:
      Boolean(campaign.operational_at) &&
      ["ACTIVE", "PAUSED", "COMPLETED", "DRAFT"].includes(campaign.status),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: deliverablesQueryKey(campaignId) })

  const createMutation = useMutation({
    mutationFn: () =>
      createDeliverable(campaignId, {
        type: newType.trim(),
        description: newDesc.trim() || undefined,
        publisher_profile_id: newPublisherId || undefined,
      }),
    onSuccess: () => {
      invalidate()
      setNewDesc("")
      toast.success("Deliverable added")
    },
    onError: () => toast.error("Could not create deliverable"),
  })

  const submitMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      submitDeliverableUrl(campaignId, id, url),
    onSuccess: () => {
      invalidate()
      toast.success("URL submitted")
    },
    onError: (e: AxiosError<{ message?: string }>) => {
      toast.error(e.response?.data?.message ?? "Could not submit URL")
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveDeliverable(campaignId, id),
    onSuccess: () => {
      invalidate()
      toast.success("Content approved")
    },
    onError: () => toast.error("Could not approve"),
  })

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string
      action: "reject" | "needs-revision"
      note?: string
    }) =>
      action === "reject"
        ? rejectDeliverable(campaignId, id, note)
        : needsRevisionDeliverable(campaignId, id, note),
    onSuccess: () => {
      invalidate()
      setReviewAction(null)
      setReviewNote("")
      toast.success("Publisher notified")
    },
    onError: () => toast.error("Could not update deliverable"),
  })

  if (!campaign.operational_at) return null

  const items = data?.items ?? []
  const summary = data?.summary

  return (
    <div className="space-y-4">
      {summary?.content_complete ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="flex items-center gap-2 py-4">
            <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
            <p className="text-sm font-medium">Content complete — all deliverables delivered</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content deliverables</CardTitle>
          <CardDescription>
            {summary
              ? `${summary.delivered} of ${summary.total} deliverables published`
              : "Track agreed content items through submission and approval"}
            {role === UserRole.BRAND
              ? " · Read-only view of delivered content"
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading deliverables…</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {role === UserRole.ADMIN
                ? "No deliverables yet. Add agreed content items for publishers to fulfil."
                : "No deliverables defined for this campaign yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((d) => (
                <DeliverableRow
                  key={d.id}
                  deliverable={d}
                  role={role}
                  url={urlById[d.id] ?? ""}
                  onUrlChange={(v) =>
                    setUrlById((prev) => ({ ...prev, [d.id]: v }))
                  }
                  onSubmit={() => {
                    const url = urlById[d.id]?.trim()
                    if (!url) {
                      toast.error("Enter a valid URL")
                      return
                    }
                    submitMutation.mutate({ id: d.id, url })
                  }}
                  submitPending={submitMutation.isPending}
                  onApprove={() => approveMutation.mutate(d.id)}
                  approvePending={approveMutation.isPending}
                  onReject={() => setReviewAction({ id: d.id, action: "reject" })}
                  onNeedsRevision={() =>
                    setReviewAction({ id: d.id, action: "needs-revision" })
                  }
                />
              ))}
            </ul>
          )}

          {role === UserRole.ADMIN ? (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">Add deliverable</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Input
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="e.g. New Article"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Publisher (optional)</Label>
                  <Select
                    value={newPublisherId || "__any__"}
                    onValueChange={(v) =>
                      setNewPublisherId(v === "__any__" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any assigned publisher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__any__">Any assigned publisher</SelectItem>
                      {(campaign.publishers ?? []).map((p) => (
                        <SelectItem
                          key={p.publisher_profile_id}
                          value={p.publisher_profile_id}
                        >
                          {p.publisher_profile?.publication_name ??
                            p.publisher_profile?.user?.name ??
                            "Publisher"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="e.g. 2 × skincare review article"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={!newType.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-3.5" aria-hidden />
                )}
                Add deliverable
              </Button>
            </div>
          ) : null}

          {role === UserRole.BRAND ? (
            <p className="text-muted-foreground text-xs">
              For feedback on content, contact TMOE directly.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={reviewAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewAction(null)
            setReviewNote("")
          }
        }}
        title={
          reviewAction?.action === "reject"
            ? "Reject this submission?"
            : "Request revision?"
        }
        description="The publisher will be notified with your note."
        confirmLabel="Confirm"
        confirmVariant={
          reviewAction?.action === "reject" ? "destructive" : "default"
        }
        isPending={reviewMutation.isPending}
        onConfirm={() => {
          if (reviewAction) {
            reviewMutation.mutate({
              id: reviewAction.id,
              action: reviewAction.action,
              note: reviewNote.trim() || undefined,
            })
          }
        }}
      >
        <div className="mt-3 space-y-2">
          <Label htmlFor="review-note">Note (optional)</Label>
          <Textarea
            id="review-note"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={3}
            placeholder="Feedback for the publisher"
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}

function DeliverableRow({
  deliverable: d,
  role,
  url,
  onUrlChange,
  onSubmit,
  submitPending,
  onApprove,
  approvePending,
  onReject,
  onNeedsRevision,
}: {
  deliverable: ContentDeliverable
  role: UserRole
  url: string
  onUrlChange: (v: string) => void
  onSubmit: () => void
  submitPending: boolean
  onApprove: () => void
  approvePending: boolean
  onReject: () => void
  onNeedsRevision: () => void
}) {
  const pubName =
    d.publisher_profile?.publication_name ??
    d.publisher_profile?.user?.name ??
    null
  const canSubmit =
    role === UserRole.PUBLISHER &&
    (d.status === "PENDING" || d.status === "REJECTED")
  const showAdminActions = role === UserRole.ADMIN && d.status === "SUBMITTED"
  const isDelivered = d.status === "DELIVERED"
  const brandPending = role === UserRole.BRAND && !isDelivered

  if (brandPending) {
    return (
      <li className="flex items-center justify-between rounded-lg border p-3 text-sm">
        <span>{d.type}</span>
        <Badge variant="outline">Pending</Badge>
      </li>
    )
  }

  return (
    <li className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{d.article_title ?? d.type}</p>
          {d.description ? (
            <p className="text-muted-foreground text-sm">{d.description}</p>
          ) : null}
          {pubName ? (
            <p className="text-muted-foreground mt-1 text-xs">{pubName}</p>
          ) : null}
        </div>
        <Badge variant={deliverableBadgeVariant(d.status)}>
          {d.status === "SUBMITTED"
            ? "Submitted — Pending approval"
            : statusLabel(d.status)}
        </Badge>
      </div>

      {d.admin_note && role !== UserRole.BRAND ? (
        <p className="text-destructive text-sm">Note: {d.admin_note}</p>
      ) : null}

      {isDelivered && d.submitted_url ? (
        <a
          href={d.submitted_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          View live article
        </a>
      ) : null}

      {d.submitted_at && role !== UserRole.BRAND ? (
        <p className="text-muted-foreground text-xs">
          Submitted {fmtDate(d.submitted_at)}
        </p>
      ) : null}

      {canSubmit ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={submitPending}
            onClick={onSubmit}
          >
            Submit URL
          </Button>
        </div>
      ) : null}

      {showAdminActions ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={approvePending}
            onClick={onApprove}
          >
            Approve
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onNeedsRevision}>
            Needs revision
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onReject}
          >
            Reject
          </Button>
        </div>
      ) : null}
    </li>
  )
}
