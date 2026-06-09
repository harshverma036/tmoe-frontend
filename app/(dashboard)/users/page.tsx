"use client"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import DataTable from "@/components/common/DataTable"
import { useDataTableState } from "@/hooks/use-data-table-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import apiConfig from "@/lib/apiConfig"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format } from "date-fns"
import { Trash } from "lucide-react"
import _ from "lodash"
import { useState } from "react"
import toast from "react-hot-toast"

type PendingApproveUser = {
  id: string
  email: string
}

type PendingDeleteUser = {
  id: string
  email: string
}

const emailLooksValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const Users = () => {
  // Table search / sort / page state — shared via `useDataTableState` for any `DataTable` screen.
  const { query, setQuery, sorting, setSorting, pagination, setPagination } =
    useDataTableState()

  const queryClient = useQueryClient()
  const [pendingApproveUser, setPendingApproveUser] =
    useState<PendingApproveUser | null>(null)
  const [pendingDeleteUser, setPendingDeleteUser] =
    useState<PendingDeleteUser | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const { isFetching, data: users } = useQuery({
    queryKey: ["all_users", query, sorting, pagination],
    queryFn: async () => {
      const params = {
        limit: pagination?.pageSize?.toString(),
        skip: String(pagination?.pageIndex * pagination?.pageSize),
        search: query,
        search_field: 'email',
      }
      const response = await apiConfig.get("/api/users/all", { params });

      return response?.data?.data
    },
  })

  const { mutate: approveUser, isPending: isApproving } = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiConfig.post(`/api/users/approve/${userId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_users"] })
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
          { email },
        )
        return response.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["all_users"] })
        toast.success("Invitation sent")
        setInviteEmail("")
        setInviteOpen(false)
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        toast.error(
          error.response?.data?.message ?? "Could not send invitation",
        )
      },
    })

  const columns = () => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: any) => _?.capitalize(row?.original?.name ?? ""),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "Role",
      header: "Role",
      cell: ({ row }: any) => _?.capitalize(row?.original?.role ?? ""),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }: any) =>
        format(new Date(row?.original?.createdAt), "dd/MM/yyyy hh:mm a"),
    },
    {
      accessorKey: "admin_approved",
      header: "Approved",
      cell: ({ row }: any) => {
        if (row?.original?.admin_approved) {
          return <Badge variant={"default"}>Approved</Badge>
        }
        return (
          <button
            type="button"
            className="inline-flex cursor-pointer rounded-md border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() =>
              setPendingApproveUser({
                id: String(row.original.id),
                email: String(row.original.email ?? ""),
              })
            }
          >
            <Badge variant={"destructive"}>Pending</Badge>
          </button>
        )
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={"ghost"}
              size={"icon-sm"}
              className="text-red-500"
              onClick={() =>
                setPendingDeleteUser({
                  id: String(row.original.id),
                  email: String(row.original.email ?? ""),
                })
              }
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
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
        title="Invite user"
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

      <DataTable
        columns={columns()}
        title="Users"
        actionButtons={
          <Button type="button" onClick={() => setInviteOpen(true)}>
            Invite User
          </Button>
        }
        data={users?.records ?? []}
        query={query}
        setQuery={setQuery}
        sorting={sorting}
        setSorting={setSorting}
        pagination={pagination}
        setPagination={setPagination}
        totalCount={users?.count ?? 0}
        count={users?.records?.length ?? 0}
        isFetching={isFetching && !users}
      />
    </div>
  )
}

export default Users
