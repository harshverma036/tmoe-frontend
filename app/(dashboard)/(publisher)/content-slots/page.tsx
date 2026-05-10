"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Search } from "lucide-react"
import toast from "react-hot-toast"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import {
    contentSlotsQueryKey,
    deleteContentSlot,
    fetchContentSlots,
} from "@/lib/api/content-slots"
import type { ContentSlot } from "@/lib/validation/content-slot-form"

import { ContentSlotCard } from "@/components/content-slots/content-slot-card"
import { ContentSlotForm } from "@/components/content-slots/content-slot-form"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

function matchesSearch(slot: ContentSlot, query: string): boolean {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
        slot.id.toLowerCase().includes(q) ||
        slot.type.toLowerCase().includes(q) ||
        slot.category.toLowerCase().includes(q) ||
        slot.monetisation_model.toLowerCase().includes(q) ||
        String(slot.estimated_traffic).includes(q)
    )
}

export default function ContentSlotsPage() {
    const queryClient = useQueryClient()
    const {
        data: slots = [],
        isFetching,
        isError,
        refetch,
    } = useQuery({
        queryKey: contentSlotsQueryKey,
        queryFn: fetchContentSlots,
    })

    const deleteSlot = useMutation({
        mutationFn: deleteContentSlot,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contentSlotsQueryKey })
            toast.success("Slot deleted")
            setDeleteTarget(null)
        },
        onError: (error: AxiosError<{ message?: string }>) => {
            toast.error(
                error.response?.data?.message ?? "Could not delete content slot",
            )
        },
    })

    const [search, setSearch] = useState("")
    const [editorOpen, setEditorOpen] = useState(false)
    const [editorMode, setEditorMode] = useState<"create" | "edit">("create")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<ContentSlot | null>(null)

    const filteredSlots = useMemo(
        () => slots.filter((s) => matchesSearch(s, search)),
        [slots, search]
    )

    /** Stable empty reference so memo does not allocate a new object each run */
    const emptyFormDefaults = useMemo(() => ({} as const), [])

    /** Form defaults for the dialog; stable when creating, derived when editing */
    const formDefaults = useMemo(() => {
        if (editorMode === "edit" && editingId) {
            const row = slots.find((s) => s.id === editingId)
            if (row) {
                return {
                    type: row.type,
                    category: row.category,
                    estimated_traffic: row.estimated_traffic,
                    monetisation_model: row.monetisation_model,
                }
            }
        }
        return emptyFormDefaults
    }, [editorMode, editingId, slots, emptyFormDefaults])

    function openCreate() {
        setEditorMode("create")
        setEditingId(null)
        setEditorOpen(true)
    }

    function openEdit(slot: ContentSlot) {
        setEditorMode("edit")
        setEditingId(slot.id)
        setEditorOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Top bar: search grows to fill row so placeholder never clips next to the button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="relative min-w-0 lg:w-lg ">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                    />
                    <Input
                        type="search"
                        placeholder="Search slots…"
                        title="Search by id, type, category, traffic, or monetisation"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full min-w-0 pl-9"
                        aria-label="Search content slots"
                    />
                </div>
                <Button type="button" className="w-full sm:w-auto sm:shrink-0" onClick={openCreate}>
                    Add Slot
                </Button>
            </div>

            {/* Responsive grid of slot cards */}
            {isFetching ? (
                <LoadingSkeleton
                    variant="card-grid"
                    cardCount={8}
                    label="Loading content slots…"
                />
            ) : isError ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Could not load slots</CardTitle>
                        <CardDescription>
                            Check your connection and try again.
                        </CardDescription>
                        <Button type="button" variant="outline" className="mt-2 w-fit" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </CardHeader>
                </Card>
            ) : filteredSlots.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No slots found</CardTitle>
                        <CardDescription>
                            Try another search or add a new slot.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {filteredSlots.map((slot) => (
                        <ContentSlotCard
                            key={slot.id}
                            slot={slot}
                            onEdit={() => openEdit(slot)}
                            onDelete={() => setDeleteTarget(slot)}
                        />
                    ))}
                </div>
            )}

            {/* Add / edit: single dialog + shared form */}
            <Dialog
                open={editorOpen}
                onOpenChange={(open) => {
                    setEditorOpen(open)
                    if (!open) setEditingId(null)
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editorMode === "create" ? "Add content slot" : "Update content slot"}
                        </DialogTitle>
                        <DialogDescription>
                            {editorMode === "create"
                                ? "Create a new slot. Required fields are validated before save."
                                : "Changes apply to this slot only."}
                        </DialogDescription>
                    </DialogHeader>
                    <ContentSlotForm
                        key={`${editorMode}-${editingId ?? "new"}`}
                        mode={editorMode}
                        slotId={editingId}
                        defaultValues={formDefaults}
                        onSuccess={() => {
                            setEditorOpen(false)
                            setEditingId(null)
                        }}
                        onCancel={() => {
                            setEditorOpen(false)
                            setEditingId(null)
                        }}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open && deleteSlot.isPending) return
                    if (!open) setDeleteTarget(null)
                }}
                title="Delete slot?"
                description={
                    deleteTarget ? (
                        <>
                            This slot will be deleted from the list. This action cannot be undone.
                        </>
                    ) : null
                }
                confirmLabel="Delete"
                pendingLabel="Deleting…"
                confirmVariant="destructive"
                isPending={deleteSlot.isPending}
                onConfirm={() => {
                    if (!deleteTarget) return
                    deleteSlot.mutate(deleteTarget.id)
                }}
            />
        </div>
    )
}
