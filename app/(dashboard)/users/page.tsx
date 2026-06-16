"use client"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { MetricCard } from "@/components/common/MetricCard"
import { useDashboardFilters } from "@/components/layout/dashboard-filters-provider"
import { DashboardFiltersShell } from "@/components/layout/dashboard-filters-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UsersTableFilters } from "@/components/users/users-table-filters"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import apiConfig from "@/lib/apiConfig"
import { UserRole } from "@/lib/dashboard-nav"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format } from "date-fns"
import { Loader2, Trash, UserPlus } from "lucide-react"
import _ from "lodash"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, useEffect, useRef } from "react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

type UserRecord = {
  id: string
  name?: string | null
  email: string
  role?: string | null
  active?: boolean
  admin_approved?: boolean
  createdAt: string
}

type PendingApproveUser = {
  id: string
  email: string
}

type PendingDeleteUser = {
  id: string
  email: string
}

type UserTab = "all" | "publishers" | "brands" | "admins" | "suspended"

const emailLooksValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function getUserStatus(user: UserRecord) {
  if (user.active === false) return "suspended"
  if (!user.admin_approved) return "pending"
  return "active"
}

function getStatusStyles(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "suspended":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function getRoleLabel(role?: string | null) {
  switch (role?.toUpperCase()) {
    case UserRole.PUBLISHER:
      return "publisher"
    case UserRole.BRAND:
      return "brand"
    case UserRole.ADMIN:
      return "admin"
    default:
      return "user"
  }
}

function getInitials(name?: string | null, email?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const local = email?.split("@")[0] ?? "?"
  return local.slice(0, 2).toUpperCase()
}

function parseUserTab(value: string | null): UserTab {
  if (
    value === "publishers" ||
    value === "brands" ||
    value === "admins" ||
    value === "suspended"
  ) {
    return value
  }
  return "all"
}

const UsersPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { search, searchField, dateRange } = useDashboardFilters()

  const activeTab = parseUserTab(searchParams.get("tab"))
  const pageIndex = Math.max(0, Number(searchParams.get("page") ?? "1") - 1)
  const pageSize = Number(searchParams.get("pageSize") ?? "10")

  const queryClient = useQueryClient()
  const [pendingApproveUser, setPendingApproveUser] =
    useState<PendingApproveUser | null>(null)
  const [pendingDeleteUser, setPendingDeleteUser] =
    useState<PendingDeleteUser | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const updatePageParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key)
      else params.set(key, value)
    })
    const query = params.toString()
    router.replace(query ? `/users?${query}` : "/users", { scroll: false })
  }

  const filterSignature = `${search}|${searchField}|${dateRange}`
  const previousFilterSignature = useRef(filterSignature)

  useEffect(() => {
    if (previousFilterSignature.current === filterSignature) return
    previousFilterSignature.current = filterSignature

    if (searchParams.get("page") && searchParams.get("page") !== "1") {
      updatePageParams({ page: "1" })
    }
  }, [filterSignature, searchParams])

  const { data: metricsData } = useQuery({
    queryKey: ["all_users_metrics"],
    queryFn: async () => {
      const response = await apiConfig.get("/api/users/all", {
        params: { limit: "5000", skip: "0" },
      })
      return response?.data?.data as { count: number; records: UserRecord[] }
    },
  })

  const metrics = useMemo(() => {
    const records = metricsData?.records ?? []
    const publishers = records.filter(
      (user) => user.role?.toUpperCase() === UserRole.PUBLISHER
    )
    const brands = records.filter(
      (user) => user.role?.toUpperCase() === UserRole.BRAND
    )
    const admins = records.filter(
      (user) => user.role?.toUpperCase() === UserRole.ADMIN
    )
    const suspended = records.filter((user) => {
      const status = getUserStatus(user)
      return status === "suspended" || status === "pending"
    })

    return {
      total: metricsData?.count ?? records.length,
      publishers: publishers.length,
      brands: brands.length,
      admins: admins.length,
      suspended: suspended.length,
      pending: records.filter((user) => !user.admin_approved).length,
    }
  }, [metricsData])

  const listParams = {
    limit: String(pageSize),
    skip: String(pageIndex * pageSize),
    search: search || undefined,
    search_field: searchField,
    date_range: dateRange || undefined,
    user_tab: activeTab,
  }

  const { isFetching, data: users } = useQuery({
    queryKey: ["all_users", listParams],
    queryFn: async () => {
      const response = await apiConfig.get("/api/users/all", {
        params: listParams,
      })
      return response?.data?.data as { count: number; records: UserRecord[] }
    },
  })

  const records = users?.records ?? []
  const totalFiltered = users?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize))

  const tabs: { id: UserTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: metrics.total },
    { id: "publishers", label: "Publishers", count: metrics.publishers },
    { id: "brands", label: "Brands", count: metrics.brands },
    { id: "admins", label: "Admins", count: metrics.admins },
    { id: "suspended", label: "Suspended", count: metrics.suspended },
  ]

  const { mutate: approveUser, isPending: isApproving } = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiConfig.post(`/api/users/approve/${userId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_users"] })
      queryClient.invalidateQueries({ queryKey: ["all_users_metrics"] })
      setPendingApproveUser(null)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not approve user")
    },
  })

  const { mutate: removeUser, isPending: isRemoving } = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiConfig.delete(`/api/users/${userId}/remove`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_users"] })
      queryClient.invalidateQueries({ queryKey: ["all_users_metrics"] })
      setPendingDeleteUser(null)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not remove user")
    },
  })

  const { mutate: sendAdminInvitation, isPending: isSendingInvite } =
    useMutation({
      mutationFn: async (email: string) => {
        const response = await apiConfig.post(
          "/api/users/send-admin-invitation",
          { email }
        )
        return response.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["all_users"] })
        queryClient.invalidateQueries({ queryKey: ["all_users_metrics"] })
        toast.success("Invitation sent")
        setInviteEmail("")
        setInviteOpen(false)
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        toast.error(
          error.response?.data?.message ?? "Could not send invitation"
        )
      },
    })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={
          <>
            TMOE Admin <span className="mx-1.5">/</span> User Management
          </>
        }
        title="User Management"
        description="All publishers, brands, and admin accounts in the ecosystem."
        actions={
          <Button
            size="sm"
            className="h-9 gap-2 rounded-xl px-4 shadow-none"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="size-4" />
            Invite Admin
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total users"
          value={formatCount(metrics.total)}
          sublabel="all accounts"
        />
        <MetricCard
          label="Publishers"
          value={formatCount(metrics.publishers)}
          sublabel="editors"
        />
        <MetricCard
          label="Brands"
          value={formatCount(metrics.brands)}
          sublabel="advertisers"
        />
        <MetricCard
          label="Admin accounts"
          value={formatCount(metrics.admins)}
          sublabel="TMOE staff"
        />
        <MetricCard
          label="Suspended / review"
          value={formatCount(metrics.suspended)}
          sublabel="requires action"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      updatePageParams({
                        tab: tab.id === "all" ? null : tab.id,
                        page: "1",
                      })
                    }}
                    className={cn(
                      "relative flex items-center gap-2 border-b-2 pb-2 text-sm transition-colors",
                      isActive ? "border-primary" : "border-transparent"
                    )}
                  >
                    <span
                      className={
                        isActive
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {tab.label}
                    </span>
                    <span
                      className={
                        isActive
                          ? "font-semibold text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {formatCount(tab.count)}
                    </span>
                  </button>
                )
              })}
            </div>

            <UsersTableFilters />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/70 hover:bg-transparent">
                <TableHead className="w-12 pl-5">
                  <input type="checkbox" className="size-4 rounded border-border" />
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  User
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Type
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Joined
                </TableHead>
                {/* <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Verified
                </TableHead> */}
                <TableHead className="pr-5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching && !users ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((user) => {
                  const status = getUserStatus(user)
                  const displayName =
                    _.capitalize(user.name ?? "") || user.email.split("@")[0]

                  return (
                    <TableRow key={user.id} className="border-border/60">
                      <TableCell className="pl-5">
                        <input type="checkbox" className="size-4 rounded border-border" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 border border-border/70">
                            <AvatarFallback className="bg-muted text-xs font-medium">
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {displayName}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-full border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-medium capitalize"
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {status === "pending" ? (
                          <button
                            type="button"
                            className="inline-flex"
                            onClick={() =>
                              setPendingApproveUser({
                                id: user.id,
                                email: user.email,
                              })
                            }
                          >
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyles(status)}`}
                            >
                              <span className="size-1.5 rounded-full bg-current" />
                              {status}
                            </span>
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyles(status)}`}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM yyyy")}
                      </TableCell>
                      {/* <TableCell>
                        {user.admin_approved ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                            <Check className="size-4" />
                            KYC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                            <Clock className="size-4" />
                            Pending
                          </span>
                        )}
                      </TableCell> */}
                      <TableCell className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setPendingDeleteUser({
                                id: user.id,
                                email: user.email,
                              })
                            }
                          >
                            <Trash className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-muted-foreground">
            Showing {records.length} of {formatCount(totalFiltered)} users
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-border/80 shadow-none"
              disabled={pageIndex === 0}
              onClick={() =>
                updatePageParams({ page: String(Math.max(1, pageIndex)) })
              }
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => {
                const pageNumber = index + 1
                const isActive = pageIndex + 1 === pageNumber
                return (
                  <Button
                    key={pageNumber}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="size-8 rounded-lg px-0"
                    onClick={() =>
                      updatePageParams({ page: String(pageNumber) })
                    }
                  >
                    {pageNumber}
                  </Button>
                )
              })}
              {pageCount > 5 ? (
                <span className="px-1 text-sm text-muted-foreground">...</span>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-border/80 shadow-none"
              disabled={pageIndex >= pageCount - 1}
              onClick={() =>
                updatePageParams({ page: String(pageIndex + 2) })
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingApproveUser}
        onOpenChange={(open) => {
          if (!open) setPendingApproveUser(null)
        }}
        title="Approve user"
        description={
          <>
            Do you want to approve {pendingApproveUser?.email} to be a user of
            TMOE?
          </>
        }
        confirmLabel="Approve"
        pendingLabel="Approving…"
        isPending={isApproving}
        confirmDisabled={!pendingApproveUser?.id}
        onConfirm={() => {
          if (pendingApproveUser?.id) {
            approveUser(pendingApproveUser.id)
          }
        }}
      />

      <ConfirmDialog
        open={!!pendingDeleteUser}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setPendingDeleteUser(null)
        }}
        title="Remove user"
        description={
          <>
            This will permanently remove{" "}
            <span className="font-medium text-foreground">
              {pendingDeleteUser?.email}
            </span>{" "}
            from TMOE. This action cannot be undone.
          </>
        }
        confirmLabel="Remove"
        pendingLabel="Removing…"
        confirmVariant="destructive"
        isPending={isRemoving}
        confirmDisabled={!pendingDeleteUser?.id}
        onConfirm={() => {
          if (pendingDeleteUser?.id) {
            removeUser(pendingDeleteUser.id)
          }
        }}
      />

      <ConfirmDialog
        open={inviteOpen}
        onOpenChange={(open) => {
          if (!open && !isSendingInvite) {
            setInviteOpen(false)
            setInviteEmail("")
          }
        }}
        title="Invite admin"
        description="Enter the email address to send an admin invitation."
        confirmLabel="Send invitation"
        pendingLabel="Sending…"
        isPending={isSendingInvite}
        confirmDisabled={!emailLooksValid(inviteEmail)}
        onConfirm={() => {
          if (emailLooksValid(inviteEmail)) {
            sendAdminInvitation(inviteEmail.trim())
          }
        }}
      >
        <div className="grid gap-2 py-1">
          <Label htmlFor="invite-user-email">Email</Label>
          <Input
            id="invite-user-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={inviteEmail}
            disabled={isSendingInvite}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}

export default function Users() {
  return (
    <DashboardFiltersShell>
      <UsersPage />
    </DashboardFiltersShell>
  )
}
