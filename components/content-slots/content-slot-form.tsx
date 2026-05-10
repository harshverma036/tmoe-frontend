"use client"

import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useForm, Controller, type Resolver } from "react-hook-form"
import toast from "react-hot-toast"

import {
  createContentSlot,
  contentSlotsQueryKey,
  updateContentSlot,
} from "@/lib/api/content-slots"
import {
  CONTENT_SLOT_TYPES,
  MONETISATION_MODELS,
  contentSlotFormSchema,
  type ContentSlotFormValues,
} from "@/lib/validation/content-slot-form"

import { Button } from "@/components/ui/button"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const emptyValues: ContentSlotFormValues = {
  type: "",
  category: "",
  estimated_traffic: 0,
  monetisation_model: "",
}

type ContentSlotFormProps = {
  /** Distinguishes submit copy and default reset behaviour */
  mode: "create" | "edit"
  /** Set when `mode` is `edit` (server id for update API). */
  slotId?: string | null
  /** Initial field values (create uses empty defaults; edit passes slot fields) */
  defaultValues?: Partial<ContentSlotFormValues>
  /** Called after a successful create or update (e.g. close dialog). */
  onSuccess: () => void
  /** Close dialog without saving */
  onCancel: () => void
}

/**
 * Shared add/update form built exclusively from shadcn Input, Select, Label, Button.
 * Validation via react-hook-form + yup; persistence via react-query mutations.
 */
export function ContentSlotForm({
  mode,
  slotId,
  defaultValues,
  onSuccess,
  onCancel,
}: ContentSlotFormProps) {
  const queryClient = useQueryClient()

  const saveSlot = useMutation({
    mutationFn: (data: ContentSlotFormValues) => {
      if (mode === "create") {
        return createContentSlot(data)
      }
      if (!slotId) {
        return Promise.reject(new Error("Missing slot id"))
      }
      return updateContentSlot(slotId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentSlotsQueryKey })
      toast.success(mode === "create" ? "Slot added" : "Slot updated")
      onSuccess()
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ??
        (mode === "create"
          ? "Could not add content slot"
          : "Could not update content slot"),
      )
    },
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContentSlotFormValues>({
    defaultValues: { ...emptyValues, ...defaultValues },
    resolver: yupResolver(
      contentSlotFormSchema
    ) as Resolver<ContentSlotFormValues>,
    mode: "onTouched",
  })

  async function onValidSubmit(data: ContentSlotFormValues) {
    await saveSlot.mutateAsync(data)
  }

  const pendingAdd = isSubmitting || saveSlot.isPending

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="slot-type">Type</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="slot-type"
                className="w-full min-w-0"
                aria-invalid={errors.type ? true : undefined}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_SLOT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.type?.message && (
          <p className="text-destructive text-sm">{errors.type.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slot-category">Category</Label>
        <Input
          id="slot-category"
          placeholder="e.g. Technology"
          aria-invalid={errors.category ? true : undefined}
          {...register("category")}
          errorMessage={errors.category?.message}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slot-traffic">Estimated traffic</Label>
        <Input
          id="slot-traffic"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          aria-invalid={errors.estimated_traffic ? true : undefined}
          {...register("estimated_traffic", { valueAsNumber: true })}
          errorMessage={errors.estimated_traffic?.message}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slot-monetisation">Monetisation model</Label>
        <Controller
          name="monetisation_model"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="slot-monetisation"
                className="w-full min-w-0"
                aria-invalid={errors.monetisation_model ? true : undefined}
              >
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {MONETISATION_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.monetisation_model?.message && (
          <p className="text-destructive text-sm">
            {errors.monetisation_model.message}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pendingAdd}>
          Cancel
        </Button>
        <Button type="submit" disabled={pendingAdd}>
          {!pendingAdd ? (mode === "create" ? "Add slot" : "Save changes") : "Submitting..."}
        </Button>
      </DialogFooter>
    </form>
  )
}
