"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format, parseISO } from "date-fns"
import { CheckCircle2, Loader2, Rss } from "lucide-react"
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
  addDeliverablesFromRss,
  approveDeliverable,
  campaignRssFeedQueryKey,
  deliverablesQueryKey,
  fetchCampaignRssFeed,
  fetchDeliverables,
  needsRevisionDeliverable,
  rejectDeliverable,
  submitDeliverableUrl,
  submitManualUrls,
  triggerRssSync,
  type ContentDeliverable,
  type DeliverableSource,
  type RssFeedItem,
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
  return "outline"
}

function sourceLabel(source?: DeliverableSource): string | null {
  if (source === "RSS_SELECTED") return "From RSS"
  if (source === "MANUAL_SUBMIT") return "Manual"
  if (source === "ADMIN_PLANNED") return "Planned"
  return null
}

function parseUrlsFromText(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  ]
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
  const [manualUrlsText, setManualUrlsText] = useState("")
  const [adminPublisherId, setAdminPublisherId] = useState("")
  const [selectedRssIds, setSelectedRssIds] = useState<Set<string>>(new Set())
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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: deliverablesQueryKey(campaignId) })
    queryClient.invalidateQueries({ queryKey: campaignRssFeedQueryKey(campaignId) })
  }

  const { data: rssItems = [], isLoading: rssLoading } = useQuery({
    queryKey: campaignRssFeedQueryKey(campaignId),
    queryFn: () => fetchCampaignRssFeed(campaignId),
    enabled:
      role === UserRole.ADMIN &&
      Boolean(campaign.operational_at) &&
      ["ACTIVE", "PAUSED", "COMPLETED", "DRAFT"].includes(campaign.status),
  })

  const rssSyncMutation = useMutation({
    mutationFn: triggerRssSync,
    onSuccess: (r) => {
      invalidate()
      toast.success(
        `RSS sync finished (${r.publishersProcessed} publishers, ${r.errors} errors)`,
      )
    },
    onError: () => toast.error("RSS sync failed"),
  })

  const manualUrlsMutation = useMutation({
    mutationFn: (urls: string[]) =>
      submitManualUrls(campaignId, {
        urls,
        ...(role === UserRole.ADMIN && adminPublisherId
          ? { publisher_profile_id: adminPublisherId }
          : {}),
      }),
    onSuccess: (result) => {
      invalidate()
      setManualUrlsText("")
      if (result.created.length > 0) {
        toast.success(
          role === UserRole.ADMIN
            ? `${result.created.length} article(s) added`
            : `${result.created.length} article(s) submitted for approval`,
        )
      }
      if (result.errors.length > 0) {
        toast.error(
          `${result.errors.length} URL(s) skipped: ${result.errors[0]?.message}`,
        )
      }
    },
    onError: (e: AxiosError<{ message?: string }>) => {
      toast.error(e.response?.data?.message ?? "Could not add URLs")
    },
  })

  const addFromRssMutation = useMutation({
    mutationFn: (ids: string[]) => addDeliverablesFromRss(campaignId, ids),
    onSuccess: (count) => {
      invalidate()
      setSelectedRssIds(new Set())
      toast.success(
        count > 0 ? `${count} article(s) added to campaign` : "No new articles added",
      )
    },
    onError: () => toast.error("Could not add selected articles"),
  })

  const submitMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      submitDeliverableUrl(campaignId, id, url),
    onSuccess: () => {
      invalidate()
      toast.success("URL submitted")
    },
    onError: (e: AxiosError<{ message?: string }>) => {
      const status = e.response?.status
      const msg = e.response?.data?.message ?? "Could not submit URL"
      toast.error(status === 409 ? msg : msg)
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
          {(role === UserRole.ADMIN || role === UserRole.PUBLISHER) ? (
            <ManualUrlsForm
              role={role}
              text={manualUrlsText}
              onTextChange={setManualUrlsText}
              adminPublisherId={adminPublisherId}
              onAdminPublisherChange={setAdminPublisherId}
              publishers={campaign.publishers ?? []}
              pending={manualUrlsMutation.isPending}
              onSubmit={() => {
                const urls = parseUrlsFromText(manualUrlsText)
                if (urls.length === 0) {
                  toast.error("Enter at least one article URL")
                  return
                }
                if (role === UserRole.ADMIN && !adminPublisherId) {
                  toast.error("Select a publisher")
                  return
                }
                manualUrlsMutation.mutate(urls)
              }}
            />
          ) : null}

          {role === UserRole.ADMIN ? (
            <AdminRssFeedPanel
              items={rssItems}
              loading={rssLoading}
              selected={selectedRssIds}
              onToggle={(id, checked) => {
                setSelectedRssIds((prev) => {
                  const next = new Set(prev)
                  if (checked) next.add(id)
                  else next.delete(id)
                  return next
                })
              }}
              syncPending={rssSyncMutation.isPending}
              onSync={() => rssSyncMutation.mutate()}
              addPending={addFromRssMutation.isPending}
              onAddSelected={() => {
                const ids = [...selectedRssIds].filter((id) => {
                  const item = rssItems.find((i) => i.id === id)
                  return item && !item.already_on_campaign
                })
                if (ids.length === 0) {
                  toast.error("Select articles not already on this campaign")
                  return
                }
                addFromRssMutation.mutate(ids)
              }}
            />
          ) : null}

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
  const canSubmit = role === UserRole.PUBLISHER && d.status === "PENDING"
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
        <div className="flex flex-wrap items-center gap-2">
          {sourceLabel(d.source) ? (
            <Badge variant="outline">{sourceLabel(d.source)}</Badge>
          ) : null}
          <Badge variant={deliverableBadgeVariant(d.status)}>
            {d.status === "SUBMITTED"
              ? "Submitted — Pending approval"
              : statusLabel(d.status)}
          </Badge>
        </div>
      </div>

      {d.thumbnail_url && (role !== UserRole.BRAND || isDelivered) ? (
        <img
          src={d.thumbnail_url}
          alt=""
          className="h-20 w-32 rounded-md object-cover"
        />
      ) : null}

      {d.metadata_status === "PENDING" &&
      d.submitted_url &&
      role !== UserRole.BRAND ? (
        <p className="text-muted-foreground text-xs">
          Fetching article details from RSS feed…
        </p>
      ) : null}

      {d.metadata_status === "FAILED" && role !== UserRole.BRAND ? (
        <p className="text-muted-foreground text-xs">
          Could not load metadata from feed — link is still recorded.
        </p>
      ) : null}

      {d.article_excerpt && isDelivered ? (
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {d.article_excerpt}
        </p>
      ) : null}

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

      {d.submitted_url && showAdminActions ? (
        <a
          href={d.submitted_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm underline-offset-4 hover:underline"
        >
          Preview submitted article
        </a>
      ) : null}

      {canSubmit ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            placeholder="https://…"
            value={url || d.submitted_url || ""}
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

function ManualUrlsForm({
  role,
  text,
  onTextChange,
  adminPublisherId,
  onAdminPublisherChange,
  publishers,
  pending,
  onSubmit,
}: {
  role: UserRole
  text: string
  onTextChange: (v: string) => void
  adminPublisherId: string
  onAdminPublisherChange: (v: string) => void
  publishers: Campaign["publishers"]
  pending: boolean
  onSubmit: () => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">Add article URLs manually</p>
      <p className="text-muted-foreground text-xs">
        One URL per line. Title, image, and summary are fetched from each article
        page automatically.{" "}
        {role === UserRole.PUBLISHER
          ? "Submissions need admin approval before the brand can see them."
          : "Articles you add are marked delivered and visible to the brand immediately."}
      </p>
      {role === UserRole.ADMIN ? (
        <div className="space-y-1.5">
          <Label>Publisher</Label>
          <Select
            value={adminPublisherId || "__none__"}
            onValueChange={(v) =>
              onAdminPublisherChange(v === "__none__" ? "" : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select publisher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select publisher…</SelectItem>
              {(publishers ?? []).map((p) => (
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
      ) : null}
      <Textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={4}
        placeholder={"https://example.com/article-1\nhttps://example.com/article-2"}
      />
      <Button type="button" size="sm" disabled={pending} onClick={onSubmit}>
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
        Add article(s)
      </Button>
    </div>
  )
}

function AdminRssFeedPanel({
  items,
  loading,
  selected,
  onToggle,
  syncPending,
  onSync,
  addPending,
  onAddSelected,
}: {
  items: RssFeedItem[]
  loading: boolean
  selected: Set<string>
  onToggle: (id: string, checked: boolean) => void
  syncPending: boolean
  onSync: () => void
  addPending: boolean
  onAddSelected: () => void
}) {
  const available = items.filter((i) => !i.already_on_campaign)
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Publisher RSS feed</p>
          <p className="text-muted-foreground text-xs">
            Sync feeds, then select articles to add as campaign deliverables (visible to brand).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={syncPending}
          onClick={onSync}
        >
          {syncPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Rss className="size-3.5" aria-hidden />
          )}
          Refresh feeds
        </Button>
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading feed articles…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No RSS articles yet. Ensure publishers have an RSS URL in settings, then click Refresh feeds.
        </p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {items.map((item) => {
            const pub =
              item.publisher_profile?.publication_name ??
              item.publisher_profile?.user?.name ??
              "Publisher"
            const disabled = item.already_on_campaign
            return (
              <li
                key={item.id}
                className={`flex gap-3 rounded-md border p-3 text-sm ${disabled ? "opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  disabled={disabled}
                  onChange={(e) => onToggle(item.id, e.target.checked)}
                  className="mt-1 size-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title ?? item.article_url}</p>
                  <p className="text-muted-foreground text-xs">{pub}</p>
                  {disabled ? (
                    <Badge variant="secondary" className="mt-1">
                      Already on campaign
                    </Badge>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <Button
        type="button"
        size="sm"
        disabled={addPending || selected.size === 0 || available.length === 0}
        onClick={onAddSelected}
      >
        Add selected to campaign
      </Button>
    </div>
  )
}
