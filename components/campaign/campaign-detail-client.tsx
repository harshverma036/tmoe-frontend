"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
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
import {
  campaignQueryKey,
  campaignsQueryKeyRoot,
  fetchCampaignById,
  reviewCampaign,
  submitCampaignForReview,
} from "@/lib/api/campaign"
import { campaignToFormValues } from "@/lib/campaign-form-mappers"
import type { CampaignBriefFormValues } from "@/lib/validation/campaign-brief-form"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { cn } from "@/lib/utils"

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return format(parseISO(iso), "PPP")
  } catch {
    return iso
  }
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
  const { role, isReady } = useDashboardUserRole()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [formSnapshot, setFormSnapshot] =
    useState<CampaignBriefFormValues | null>(null)
  const [reviewChoice, setReviewChoice] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  )

  const { data: campaign, isLoading, isError, refetch } = useQuery({
    queryKey: campaignQueryKey(id),
    queryFn: () => fetchCampaignById(id),
    enabled:
      isReady &&
      !!role &&
      (role === UserRole.ADMIN || role === UserRole.BRAND) &&
      Boolean(id),
    retry: false,
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
        variables === "APPROVED"
          ? "Campaign approved"
          : "Campaign rejected",
      )
      setReviewChoice(null)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not update status")
    },
  })

  if (!isReady || !role) {
    return <LoadingSkeleton variant="default" />
  }

  if (role !== UserRole.ADMIN && role !== UserRole.BRAND) {
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

  const canBrandEdit =
    role === UserRole.BRAND &&
    (campaign.status === "DRAFT" || campaign.status === "REJECTED")
  const canSubmit =
    role === UserRole.BRAND && campaign.status === "DRAFT"
  const canReview =
    role === UserRole.ADMIN && campaign.status === "UNDER_REVIEW"

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

      <div className="animate-in fade-in-0 zoom-in-95 fill-mode-both duration-500 overflow-hidden rounded-2xl border border-border/80 bg-linear-to-br from-card via-card to-primary/5 p-6 shadow-md ring-1 ring-black/5 dark:ring-white/10 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge>{campaign.status.replace(/_/g, " ")}</Badge>
              <Badge variant="outline">{campaign.target_market}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {campaign.name}
            </h1>
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
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailBlock label="Target categories" delayClass="delay-[0ms]">
          <ul className="list-inside list-disc space-y-1">
            {campaign.target_category.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </DetailBlock>
        <DetailBlock label="Product SKUs" delayClass="delay-[75ms]">
          <ul className="list-inside list-disc space-y-1">
            {campaign.product_skus.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </DetailBlock>
        <DetailBlock label="Budget range (USD)" delayClass="delay-[150ms]">
          ${campaign.budget_min.toLocaleString()} – $
          {campaign.budget_max.toLocaleString()}
        </DetailBlock>
        <DetailBlock label="Targets" delayClass="delay-[225ms]">
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

      <DetailBlock label="Commerce links" delayClass="delay-[300ms]">
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

      {campaign.description ? (
        <DetailBlock label="Notes" delayClass="delay-[380ms]">
          <p className="whitespace-pre-wrap">{campaign.description}</p>
        </DetailBlock>
      ) : null}

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
              onSuccess={(_c) => {
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
    </div>
  )
}
