"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format, parseISO } from "date-fns"
import { CheckCircle2, XCircle } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  campaignApplicationsQueryKey,
  campaignQueryKey,
  campaignsQueryKeyRoot,
  fetchCampaignApplications,
  reviewCampaignApplication,
} from "@/lib/api/campaign"
import type { CampaignApplication } from "@/lib/campaign.types"

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return format(parseISO(iso), "PPP")
  } catch {
    return iso
  }
}

type Props = {
  campaignId: string
}

export function CampaignApplicationsPanel({ campaignId }: Props) {
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState<CampaignApplication | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [approveTarget, setApproveTarget] = useState<CampaignApplication | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: campaignApplicationsQueryKey(campaignId),
    queryFn: () => fetchCampaignApplications(campaignId),
  })

  const reviewMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
      rejection_note,
    }: {
      applicationId: string
      status: "APPROVED" | "REJECTED"
      rejection_note?: string
    }) =>
      reviewCampaignApplication(campaignId, applicationId, status, rejection_note),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: campaignApplicationsQueryKey(campaignId),
      })
      queryClient.invalidateQueries({ queryKey: campaignQueryKey(campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeyRoot })
      toast.success(
        vars.status === "APPROVED"
          ? "Application approved — publisher onboarded"
          : "Application declined",
      )
      setRejectTarget(null)
      setRejectNote("")
      setApproveTarget(null)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not review application")
    },
  })

  const applications = data?.items ?? []
  const pending = applications.filter((a) => a.status === "PENDING")

  if (isLoading) {
    return <LoadingSkeleton variant="default" />
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publisher applications</CardTitle>
          <CardDescription>
            No applications yet. Publishers can apply from the marketplace while
            this campaign is live and unassigned.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publisher applications</CardTitle>
          <CardDescription>
            {pending.length > 0
              ? `${pending.length} pending application${pending.length === 1 ? "" : "s"} to review.`
              : "All applications have been reviewed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {applications.map((app) => {
              const pub = app.publisher_profile
              const name =
                pub?.publication_name ??
                pub?.user?.name ??
                pub?.user?.email ??
                "Publisher"
              return (
                <li
                  key={app.id}
                  className="rounded-lg border border-border/80 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-muted-foreground text-sm">
                        {pub?.content_categories?.join(", ") || "—"}
                        {pub?.monthly_sessions != null
                          ? ` · ${pub.monthly_sessions.toLocaleString()} sessions/mo`
                          : ""}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                        Applied {fmtDate(app.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        app.status === "APPROVED"
                          ? "secondary"
                          : app.status === "REJECTED"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {app.status === "PENDING"
                        ? "Pending"
                        : app.status === "APPROVED"
                          ? "Approved"
                          : "Declined"}
                    </Badge>
                  </div>
                  {app.note ? (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Note: </span>
                      {app.note}
                    </p>
                  ) : null}
                  {app.status === "PENDING" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5"
                        disabled={reviewMutation.isPending}
                        onClick={() => setApproveTarget(app)}
                      >
                        <CheckCircle2 className="size-3.5" aria-hidden />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={reviewMutation.isPending}
                        onClick={() => setRejectTarget(app)}
                      >
                        <XCircle className="size-3.5" aria-hidden />
                        Decline
                      </Button>
                    </div>
                  ) : null}
                  {app.rejection_note ? (
                    <p className="text-muted-foreground text-sm">
                      Decline reason: {app.rejection_note}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve application"
        description="The publisher will be onboarded to this campaign immediately (no separate accept step)."
        confirmLabel="Approve & onboard"
        isPending={reviewMutation.isPending}
        onConfirm={() => {
          if (!approveTarget) return
          reviewMutation.mutate({
            applicationId: approveTarget.id,
            status: "APPROVED",
          })
        }}
      />

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
            setRejectNote("")
          }
        }}
        title="Decline application"
        description="The publisher will be notified. They may apply again later."
        confirmLabel="Decline application"
        confirmVariant="destructive"
        isPending={reviewMutation.isPending}
        onConfirm={() => {
          if (!rejectTarget) return
          reviewMutation.mutate({
            applicationId: rejectTarget.id,
            status: "REJECTED",
            rejection_note: rejectNote,
          })
        }}
      >
        <div className="space-y-2 pt-2">
          <Label htmlFor="reject-note">Reason (optional)</Label>
          <Textarea
            id="reject-note"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Optional feedback for the publisher"
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </>
  )
}
