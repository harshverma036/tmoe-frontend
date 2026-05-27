"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  createRoiBenchmark,
  fetchRoiBenchmarks,
  roiBenchmarksQueryKey,
  updateRoiBenchmark,
} from "@/lib/api/roi-benchmarks"
import type { RoiBenchmark } from "@/lib/campaign.types"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { UserRole } from "@/lib/dashboard-nav"

export default function RoiBenchmarksPage() {
  const { role, isReady } = useDashboardUserRole()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<RoiBenchmark>>({})
  const [newRow, setNewRow] = useState({
    category: "",
    cvr: "0.02",
    aov: "50",
    traffic_multiplier: "1",
    ctr: "0.03",
  })

  const { data: rows = [], isLoading } = useQuery({
    queryKey: roiBenchmarksQueryKey,
    queryFn: fetchRoiBenchmarks,
    enabled: isReady && role === UserRole.ADMIN,
  })

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<RoiBenchmark> }) =>
      updateRoiBenchmark(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roiBenchmarksQueryKey })
      setEditingId(null)
      toast.success("Benchmark saved")
    },
    onError: () => toast.error("Could not save benchmark"),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createRoiBenchmark({
        category: newRow.category.trim(),
        cvr: Number(newRow.cvr),
        aov: Number(newRow.aov),
        traffic_multiplier: Number(newRow.traffic_multiplier),
        ctr: Number(newRow.ctr),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roiBenchmarksQueryKey })
      setNewRow({
        category: "",
        cvr: "0.02",
        aov: "50",
        traffic_multiplier: "1",
        ctr: "0.03",
      })
      toast.success("Category added")
    },
    onError: () => toast.error("Could not create benchmark"),
  })

  if (!isReady) return <LoadingSkeleton variant="default" />
  if (role !== UserRole.ADMIN) {
    return <p className="text-muted-foreground text-sm">Admin access only.</p>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ROI benchmarks</h1>
        <p className="text-muted-foreground text-sm">
          These values drive all ROI estimates. Changes affect future calculations only.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="default" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category benchmarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">CVR</th>
                    <th className="pb-2 pr-4">AOV</th>
                    <th className="pb-2 pr-4">Traffic ×</th>
                    <th className="pb-2 pr-4">CTR</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium">{row.category}</td>
                      {(["cvr", "aov", "traffic_multiplier", "ctr"] as const).map(
                        (field) => (
                          <td key={field} className="py-2 pr-4">
                            {editingId === row.id ? (
                              <Input
                                className="h-8 w-24"
                                value={String(draft[field] ?? row[field])}
                                onChange={(e) =>
                                  setDraft((d) => ({
                                    ...d,
                                    [field]: Number(e.target.value),
                                  }))
                                }
                              />
                            ) : (
                              <span className="tabular-nums">{row[field]}</span>
                            )}
                          </td>
                        ),
                      )}
                      <td className="py-2">
                        {editingId === row.id ? (
                          <Button
                            size="sm"
                            disabled={saveMutation.isPending}
                            onClick={() =>
                              saveMutation.mutate({ id: row.id, body: draft })
                            }
                          >
                            Save
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(row.id)
                              setDraft(row)
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 rounded-lg border border-dashed p-4 sm:grid-cols-5">
              <Input
                placeholder="New category"
                value={newRow.category}
                onChange={(e) =>
                  setNewRow((r) => ({ ...r, category: e.target.value }))
                }
              />
              <Input
                placeholder="CVR"
                value={newRow.cvr}
                onChange={(e) => setNewRow((r) => ({ ...r, cvr: e.target.value }))}
              />
              <Input
                placeholder="AOV"
                value={newRow.aov}
                onChange={(e) => setNewRow((r) => ({ ...r, aov: e.target.value }))}
              />
              <Input
                placeholder="Traffic mult."
                value={newRow.traffic_multiplier}
                onChange={(e) =>
                  setNewRow((r) => ({ ...r, traffic_multiplier: e.target.value }))
                }
              />
              <Button
                type="button"
                disabled={!newRow.category.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                Add category
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
