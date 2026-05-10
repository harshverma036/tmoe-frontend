"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import toast from "react-hot-toast"

import type {
  ContentSlot,
  ContentSlotFormValues,
} from "@/lib/validation/content-slot-form"

import { ContentSlotCard } from "@/components/content-slots/content-slot-card"
import { ContentSlotForm } from "@/components/content-slots/content-slot-form"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

/** Seed list until slots are loaded from the API */
const INITIAL_SLOTS: ContentSlot[] = [
  {
    id: "slot_seed_1",
    createdAt: "2026-01-15T10:30:00.000Z",
    updatedAt: "2026-02-01T14:00:00.000Z",
    type: "Newsletter",
    category: "Technology",
    estimated_traffic: 48000,
    monetisation_model: "CPM",
  },
  {
    id: "slot_seed_2",
    createdAt: "2026-02-10T09:15:00.000Z",
    updatedAt: "2026-02-10T09:15:00.000Z",
    type: "Video",
    category: "Lifestyle",
    estimated_traffic: 120000,
    monetisation_model: "Sponsored",
  },
]

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
  const [slots, setSlots] = useState<ContentSlot[]>(INITIAL_SLOTS)
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
  const formDefaults = useMemo((): Partial<ContentSlotFormValues> => {
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

  function handleFormSubmit(data: ContentSlotFormValues) {
    const now = new Date().toISOString()
    if (editorMode === "create") {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? `slot_${crypto.randomUUID()}`
          : `slot_${Date.now()}`
      setSlots((prev) => [
        {
          id,
          createdAt: now,
          updatedAt: now,
          ...data,
        },
        ...prev,
      ])
      toast.success("Slot added")
    } else if (editingId) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                ...data,
                updatedAt: now,
              }
            : s
        )
      )
      toast.success("Slot updated")
    }
    setEditorOpen(false)
    setEditingId(null)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setSlots((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    toast.success("Slot deleted")
    setDeleteTarget(null)
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
      {filteredSlots.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No slots found</CardTitle>
            <CardDescription>
              Try another search or add a new slot.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            defaultValues={formDefaults}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setEditorOpen(false)
              setEditingId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete slot?</DialogTitle>
            <DialogDescription>
              This removes{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.id}
              </span>{" "}
              from the list. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
