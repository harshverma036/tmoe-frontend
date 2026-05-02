"use client"

import DataTable from "@/components/common/DataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import apiConfig from "@/lib/apiConfig"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format } from "date-fns"
import { Eye, Loader2, Trash } from "lucide-react"
import _, { size } from "lodash"
import { useState } from "react"
import toast from "react-hot-toast"

type PendingApproveUser = {
  id: string
  email: string
}

const Users = () => {
  const queryClient = useQueryClient()
  const [pendingApproveUser, setPendingApproveUser] =
    useState<PendingApproveUser | null>(null)

  const { isFetching, data: users } = useQuery({
    queryKey: ["all_users"],
    queryFn: async () => {
      const response = await apiConfig.get("/api/users/all")

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
          <div className="">
            <Button variant={"ghost"} size={"icon-sm"} className="text-red-500">
              {/* delete */}
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <Dialog
        open={!!pendingApproveUser}
        onOpenChange={(open) => {
          if (!open) setPendingApproveUser(null)
        }}
      >
        <DialogContent showCloseButton={!isApproving}>
          <DialogHeader>
            <DialogTitle>Approve user</DialogTitle>
            <DialogDescription>
              Do you want to approve {pendingApproveUser?.email} to be a user of
              TMOE?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isApproving}
              onClick={() => setPendingApproveUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isApproving || !pendingApproveUser?.id}
              onClick={() => {
                if (pendingApproveUser?.id) {
                  approveUser(pendingApproveUser.id)
                }
              }}
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Approving…
                </>
              ) : (
                "Approve"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns()}
        title="Users"
        actionButtons={<Button>Invite User</Button>}
        // isCustomFilter
        // customFilter={<div>filer</div>}
        data={users?.records ?? []}
        pagination={{
          pageIndex: 0,
          pageSize: 10,
        }}
        totalCount={users?.count ?? 0}
        count={users?.records?.length ?? 0}
        isFetching={isFetching && !users}
      />
    </div>
  )
}

export default Users
