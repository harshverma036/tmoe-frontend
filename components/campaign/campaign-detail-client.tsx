"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format, parseISO } from "date-fns"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Send,
  XCircle,
} from "lucide-react"
import toast from "react-hot-toast"

import { CampaignBriefForm } from "@/components/campaign/campaign-brief-form"
import { CampaignDeliverablesSection } from "@/components/campaign/campaign-deliverables-section"
import { CampaignPerformancePanel } from "@/components/campaign/campaign-performance-panel"
import { RoiEstimatorWidget } from "@/components/campaign/roi-estimator-widget"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  acceptCampaignAssignment,
  rejectCampaignAssignment,
  assignPublishers,
  campaignHistoryQueryKey,
  campaignQueryKey,
  campaignsQueryKeyRoot,
  fetchCampaignById,
  fetchCampaignHistory,
  reviewCampaign,
  submitCampaignForReview,
  transitionCampaignStatus,
} from "@/lib/api/campaign"
import { campaignToFormValues } from "@/lib/campaign-form-mappers"
import type { CampaignStatus } from "@/lib/campaign.types"
import type { CampaignBriefFormValues } from "@/lib/validation/campaign-brief-form"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { cn } from "@/lib/utils"
import { PublisherMultiSelect } from "@/components/campaign/publisher-multi-select"
import { fetchPublishersForAssignment } from "@/lib/api/publisher-search"
import { getUserIdFromCookie } from "@/lib/user-info-cookie"
import type { CampaignPublisherAssignment } from "@/lib/campaign.types"

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return format(parseISO(iso), "PPP")
  } catch {
    return iso
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ")
}

const OPERATIONAL_STEPS: CampaignStatus[] = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
]

const PUBLISHER_ASSIGNMENT_RESPONSE_STATUSES: CampaignStatus[] = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
]

function findMyPublisherAssignment(
  publishers: CampaignPublisherAssignment[] | undefined,
  userId: string | null,
) {
  if (!userId || !publishers?.length) return undefined
  return publishers.find((p) => p.publisher_profile?.user?.id === userId)
}

function DetailBlock({
  label,
  children,
  delayClass,
}: {
  label: string
  children: ReactNode
  delayClass?: string
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-500 rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm",
        delayClass,
      )}
    >
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </p>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

export function CampaignDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { role, isReady } = useDashboardUserRole()
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [formSnapshot, setFormSnapshot] =
    useState<CampaignBriefFormValues | null>(null)
  const [reviewChoice, setReviewChoice] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  )
  const [statusChoice, setStatusChoice] = useState<CampaignStatus | null>(null)
  const [statusNote, setStatusNote] = useState("")
  const [detailTab, setDetailTab] = useState<"overview" | "performance" | "content">(
    "overview",
  )
  const [publisherSearch, setPublisherSearch] = useState("")
  const [pickPublishers, setPickPublishers] = useState<string[]>([])
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineNote, setDeclineNote] = useState("")

  useEffect(() => {
    setUserId(getUserIdFromCookie())
  }, [])

  const { data: campaign, isLoading, isError, refetch } = useQuery({
    queryKey: campaignQueryKey(id),
    queryFn: () => fetchCampaignById(id),
    enabled:
      isReady &&
      !!role &&
      (role === UserRole.ADMIN ||
        role === UserRole.BRAND ||
        role === UserRole.PUBLISHER) &&
      Boolean(id),
    retry: false,
  })

  const { data: history = [] } = useQuery({
    queryKey: campaignHistoryQueryKey(id),
    queryFn: () => fetchCampaignHistory(id),
    enabled: isReady && role === UserRole.ADMIN && Boolean(id),
  })

  const { data: publisherPool, isLoading: publisherPoolLoading } = useQuery({
    queryKey: ["publisher-pool", publisherSearch],
    queryFn: () =>
      fetchPublishersForAssignment({
        search: publisherSearch || undefined,
        limit: 200,
      }),
    enabled: role === UserRole.ADMIN && Boolean(campaign?.operational_at),
  })

  useEffect(() => {
    if (editOpen && campaign) {
      setFormSnapshot(campaignToFormValues(campaign))
    }
  }, [editOpen, campaign])

  const submitMutation = useMutation({
    mutationFn: () => submitCampaignForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeyRoot })
      toast.success("Submitted for review")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Could not submit for review",
      )
    },
  })

  const reviewMutation = useMutation({
    mutationFn: (status: "APPROVED" | "REJECTED") => reviewCampaign(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeyRoot })
      toast.success(
        variables === "APPROVED" ? "Campaign approved" : "Campaign rejected",
      )
      setReviewChoice(null)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not update status")
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: CampaignStatus) =>
      transitionCampaignStatus(id, status, statusNote.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: campaignHistoryQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeyRoot })
      toast.success("Status updated")
      setStatusChoice(null)
      setStatusNote("")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Invalid status transition")
    },
  })

  const acceptMutation = useMutation({
    mutationFn: () => acceptCampaignAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeyRoot })
      toast.success("Assignment accepted")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not accept assignment")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (note?: string) => rejectCampaignAssignment(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeyRoot })
      toast.success("Assignment declined")
      setDeclineOpen(false)
      setDeclineNote("")
      router.push("/campaign")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not decline assignment")
    },
  })

  const assignMutation = useMutation({
    mutationFn: () => assignPublishers(id, pickPublishers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignQueryKey(id) })
      setPickPublishers([])
      toast.success("Publishers assigned")
    },
    onError: () => toast.error("Could not assign publishers"),
  })

  const myAssignment = useMemo(
    () => findMyPublisherAssignment(campaign?.publishers, userId),
    [campaign?.publishers, userId],
  )

  if (!isReady || !role) {
    return <LoadingSkeleton variant="default" />
  }

  if (role !== UserRole.ADMIN && role !== UserRole.BRAND && role !== UserRole.PUBLISHER) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have access to this campaign.
      </p>
    )
  }

  if (isLoading) {
    return <LoadingSkeleton variant="default" />
  }

  if (isError || !campaign) {
    return (
      <Card className="max-w-lg border-destructive/40">
        <CardHeader>
          <CardTitle>Campaign not found</CardTitle>
          <CardDescription>
            It may have been removed or you may not have permission to view it.
          </CardDescription>
          <Button asChild variant="outline" className="mt-2 w-fit">
            <Link href="/campaign">Back to campaigns</Link>
          </Button>
        </CardHeader>
      </Card>
    )
  }

  const isBrief = !campaign.operational_at
  const isOperational = Boolean(campaign.operational_at)
  const canRespondToAssignment =
    role === UserRole.PUBLISHER &&
    isOperational &&
    PUBLISHER_ASSIGNMENT_RESPONSE_STATUSES.includes(campaign.status) &&
    Boolean(myAssignment) &&
    !myAssignment?.accepted_at
  const hasAcceptedAssignment =
    role === UserRole.PUBLISHER && Boolean(myAssignment?.accepted_at)

  const canBrandEdit =
    role === UserRole.BRAND &&
    isBrief &&
    (campaign.status === "DRAFT" || campaign.status === "REJECTED")
  const canSubmit =
    role === UserRole.BRAND && isBrief && campaign.status === "DRAFT"
  const canReview =
    role === UserRole.ADMIN && isBrief && campaign.status === "UNDER_REVIEW"
  const canConvert =
    role === UserRole.ADMIN &&
    isBrief &&
    campaign.status === "APPROVED"

  const adminStatusActions: { status: CampaignStatus; label: string }[] = []
  if (role === UserRole.ADMIN && isOperational) {
    if (campaign.status === "DRAFT")
      adminStatusActions.push({ status: "ACTIVE", label: "Activate" })
    if (campaign.status === "ACTIVE") {
      adminStatusActions.push({ status: "PAUSED", label: "Pause" })
      adminStatusActions.push({ status: "COMPLETED", label: "Complete" })
    }
    if (campaign.status === "PAUSED")
      adminStatusActions.push({ status: "ACTIVE", label: "Resume" })
    if (["DRAFT", "ACTIVE", "PAUSED"].includes(campaign.status))
      adminStatusActions.push({ status: "CANCELLED", label: "Cancel" })
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500 mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1">
          <Link href="/campaign">
            <ArrowLeft className="size-4" aria-hidden />
            Campaigns
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-linear-to-br from-card via-card to-primary/5 p-6 shadow-md sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge>{statusLabel(campaign.status)}</Badge>
              {isOperational ? (
                <Badge variant="secondary">Operational</Badge>
              ) : (
                <Badge variant="outline">Brief</Badge>
              )}
              <Badge variant="outline">{campaign.target_market}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {campaign.name}
            </h1>
            {campaign.brand_profile ? (
              <p className="text-muted-foreground text-sm">
                Brand: {campaign.brand_profile.brand_name}
              </p>
            ) : null}
            <p className="text-muted-foreground text-sm tabular-nums">
              Last updated {fmtDate(campaign.updated_at ?? campaign.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canBrandEdit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-3.5" aria-hidden />
                Edit brief
              </Button>
            ) : null}
            {canSubmit ? (
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-3.5" aria-hidden />
                )}
                Submit for review
              </Button>
            ) : null}
            {canReview ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => setReviewChoice("APPROVED")}
                >
                  <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setReviewChoice("REJECTED")}
                >
                  <XCircle className="size-3.5" aria-hidden />
                  Reject
                </Button>
              </>
            ) : null}
            {canConvert ? (
              <Button asChild size="sm">
                <Link href={`/campaign/${id}/convert`}>Convert to campaign</Link>
              </Button>
            ) : null}
            {adminStatusActions.map((a) => (
              <Button
                key={a.status}
                type="button"
                size="sm"
                variant={a.status === "CANCELLED" ? "destructive" : "default"}
                onClick={() => setStatusChoice(a.status)}
              >
                {a.label}
              </Button>
            ))}
            {canRespondToAssignment ? (
              <>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                  onClick={() => acceptMutation.mutate()}
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-3.5" aria-hidden />
                  )}
                  Accept
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                  onClick={() => setDeclineOpen(true)}
                >
                  <XCircle className="size-3.5" aria-hidden />
                  Decline
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {canRespondToAssignment ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-3 py-4">
            <p className="font-medium">New campaign assignment</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Review the campaign details below. Accept to confirm you will
              participate, or decline if you cannot take this campaign — TMOE
              will be notified.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                onClick={() => acceptMutation.mutate()}
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : null}
                Accept assignment
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                onClick={() => setDeclineOpen(true)}
              >
                Decline assignment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {hasAcceptedAssignment ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-4 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              You accepted this assignment
            </p>
            <p className="text-muted-foreground mt-1">
              TMOE will coordinate execution. Use the Content tab when you are
              ready to submit deliverables.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {role === UserRole.BRAND && isOperational && campaign.status === "DRAFT" ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 text-sm">
            <p className="font-medium">Review this campaign with TMOE</p>
            <p className="text-muted-foreground mt-1">
              This campaign is in Draft. Review the budget, publishers, and ROI
              estimate below. When you are ready, TMOE will activate it.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isOperational ? (
        <>
          <div className="flex flex-wrap gap-2 border-b pb-2">
            {(
              [
                { id: "overview" as const, label: "Overview" },
                { id: "performance" as const, label: "Performance" },
                { id: "content" as const, label: "Content" },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={detailTab === tab.id ? "default" : "ghost"}
                onClick={() => setDetailTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {detailTab === "performance" ? (
            <CampaignPerformancePanel campaign={campaign} />
          ) : null}

          {detailTab === "content" ? (
            <CampaignDeliverablesSection
              campaignId={id}
              campaign={campaign}
              role={role}
            />
          ) : null}

          {detailTab === "overview" ? (
            <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status tracker</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {OPERATIONAL_STEPS.map((step) => (
                <Badge
                  key={step}
                  variant={
                    campaign.status === step
                      ? "default"
                      : OPERATIONAL_STEPS.indexOf(campaign.status) >
                          OPERATIONAL_STEPS.indexOf(step)
                        ? "secondary"
                        : "outline"
                  }
                >
                  {statusLabel(step)}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailBlock label="Content budget">
              ${(campaign.content_budget ?? 0).toLocaleString()}
            </DetailBlock>
            <DetailBlock label="Distribution budget">
              ${(campaign.distribution_budget ?? 0).toLocaleString()}
            </DetailBlock>
            <DetailBlock label="Dates">
              {fmtDate(campaign.start_date)} – {fmtDate(campaign.end_date)}
            </DetailBlock>
            <DetailBlock label="Content type">
              {campaign.content_type ?? "—"}
            </DetailBlock>
          </div>

          {(campaign.est_gmv != null || role === UserRole.ADMIN) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ROI summary</CardTitle>
                <CardDescription>Estimated at campaign setup</CardDescription>
              </CardHeader>
              <CardContent>
                {campaign.est_gmv != null ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <p>
                      Traffic:{" "}
                      <span className="font-medium tabular-nums">
                        {campaign.est_traffic?.toLocaleString() ?? "—"}
                      </span>
                    </p>
                    <p>
                      GMV:{" "}
                      <span className="font-medium tabular-nums">
                        ${campaign.est_gmv?.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      ROI:{" "}
                      <span className="font-medium tabular-nums">
                        {campaign.est_roi != null
                          ? `${(campaign.est_roi * 100).toFixed(1)}%`
                          : "—"}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Not calculated yet.</p>
                )}
                {role === UserRole.ADMIN ? (
                  <div className="mt-4">
                    <RoiEstimatorWidget
                      campaignId={id}
                      defaultBody={{
                        content_budget: campaign.content_budget ?? 0,
                        distribution_budget: campaign.distribution_budget ?? 0,
                        category: campaign.target_category[0],
                        ...(campaign.publishers?.length
                          ? {
                              publisher_ids: campaign.publishers.map(
                                (p) => p.publisher_profile_id,
                              ),
                            }
                          : {}),
                      }}
                      onEstimated={() => refetch()}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {role === UserRole.ADMIN &&
          campaign.publishers &&
          campaign.publishers.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned publishers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {campaign.publishers.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                    >
                      <span className="font-medium">
                        {p.publisher_profile?.publication_name ??
                          p.publisher_profile?.user?.name ??
                          "Publisher"}
                      </span>
                      <Badge variant={p.accepted_at ? "secondary" : "outline"}>
                        {p.accepted_at ? "Accepted" : "Pending acceptance"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {role === UserRole.ADMIN ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assign publishers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PublisherMultiSelect
                  publishers={publisherPool?.items ?? []}
                  value={pickPublishers}
                  onChange={setPickPublishers}
                  search={publisherSearch}
                  onSearchChange={setPublisherSearch}
                  isLoading={publisherPoolLoading}
                />
                <Button
                  type="button"
                  disabled={!pickPublishers.length || assignMutation.isPending}
                  onClick={() => assignMutation.mutate()}
                >
                  Assign selected
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {history.length > 0 && role === UserRole.ADMIN ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign history</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {history.map((h) => (
                    <li key={h.id} className="border-b border-border/60 pb-2">
                      <span className="font-medium">
                        {h.from_status ? statusLabel(h.from_status) : "—"} →{" "}
                        {statusLabel(h.to_status)}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {fmtDate(h.created_at)}
                        {h.actor?.email ? ` · ${h.actor.email}` : ""}
                      </span>
                      {h.note ? (
                        <p className="text-muted-foreground mt-1 text-xs">{h.note}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
            </>
          ) : null}
        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailBlock label="Target categories">
          <ul className="list-inside list-disc space-y-1">
            {campaign.target_category.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </DetailBlock>
        <DetailBlock label="Product SKUs">
          <ul className="list-inside list-disc space-y-1">
            {campaign.product_skus.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </DetailBlock>
        <DetailBlock label="Budget range (USD)">
          ${campaign.budget_min.toLocaleString()} – $
          {campaign.budget_max.toLocaleString()}
        </DetailBlock>
        <DetailBlock label="Targets">
          <p>
            <span className="text-muted-foreground">GMV: </span>
            {campaign.gmv_target != null
              ? `$${Number(campaign.gmv_target).toLocaleString()}`
              : "—"}
          </p>
          <p className="mt-1">
            <span className="text-muted-foreground">ROI: </span>
            {campaign.roi_target != null
              ? Number(campaign.roi_target).toFixed(2)
              : "—"}
          </p>
        </DetailBlock>
      </div>

      <DetailBlock label="Commerce links">
        <ul className="space-y-2">
          {campaign.commerce_links.map((href) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {href}
              </a>
            </li>
          ))}
        </ul>
      </DetailBlock>

      <Separator />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit campaign brief</DialogTitle>
            <DialogDescription>
              Update any field; only changes are sent to the server.
            </DialogDescription>
          </DialogHeader>
          {formSnapshot ? (
            <CampaignBriefForm
              key={campaign.updated_at ?? campaign.id}
              mode="edit"
              campaignId={campaign.id}
              defaultValues={formSnapshot}
              initialSnapshot={formSnapshot}
              onSuccess={() => {
                setEditOpen(false)
                void refetch()
              }}
              onCancel={() => setEditOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={reviewChoice !== null}
        onOpenChange={(open) => !open && setReviewChoice(null)}
        title={
          reviewChoice === "APPROVED"
            ? "Approve this campaign?"
            : "Reject this campaign?"
        }
        description={
          reviewChoice === "APPROVED"
            ? "The brand will be notified that this brief is approved."
            : "The brand can revise and resubmit after rejection."
        }
        confirmLabel={reviewChoice === "APPROVED" ? "Approve" : "Reject"}
        confirmVariant={reviewChoice === "REJECTED" ? "destructive" : "default"}
        isPending={reviewMutation.isPending}
        pendingLabel="Updating…"
        onConfirm={() => {
          if (reviewChoice) reviewMutation.mutate(reviewChoice)
        }}
      />

      <ConfirmDialog
        open={declineOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeclineOpen(false)
            setDeclineNote("")
          }
        }}
        title="Decline this assignment?"
        description="You will be removed from this campaign. TMOE will be notified and can assign another publisher."
        confirmLabel="Decline assignment"
        confirmVariant="destructive"
        isPending={rejectMutation.isPending}
        pendingLabel="Declining…"
        onConfirm={() => rejectMutation.mutate(declineNote)}
      >
        <div className="mt-3 space-y-2">
          <Label htmlFor="decline-note">Reason (optional)</Label>
          <Textarea
            id="decline-note"
            value={declineNote}
            onChange={(e) => setDeclineNote(e.target.value)}
            rows={3}
            placeholder="e.g. Schedule conflict for this period"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={statusChoice !== null}
        onOpenChange={(open) => {
          if (!open) {
            setStatusChoice(null)
            setStatusNote("")
          }
        }}
        title={`Change status to ${statusChoice ? statusLabel(statusChoice) : ""}?`}
        description="Assigned publishers and the brand will be notified. Add an optional progress note for the audit log."
        confirmLabel="Confirm"
        isPending={statusMutation.isPending}
        pendingLabel="Updating…"
        onConfirm={() => {
          if (statusChoice) statusMutation.mutate(statusChoice)
        }}
      >
        {role === UserRole.ADMIN ? (
          <div className="mt-3 space-y-2">
            <Label htmlFor="status-note">Progress note (optional)</Label>
            <Textarea
              id="status-note"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              placeholder="e.g. Distribution live, first articles publishing this week"
            />
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
