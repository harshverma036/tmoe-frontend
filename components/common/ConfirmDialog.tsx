"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import * as React from "react"

export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Renders between the header and the action buttons (forms, lists, etc.). */
  children?: React.ReactNode
  cancelLabel?: string
  confirmLabel: string
  /** Text shown in the confirm button while `isPending` is true. */
  pendingLabel?: string
  /** Use `destructive` for remove/delete; `default` for general confirmation. */
  confirmVariant?: "default" | "destructive"
  isPending?: boolean
  onConfirm: () => void
  onCancel?: () => void
  confirmDisabled?: boolean
  contentClassName?: string
  /** Close (X) visibility; defaults to off while pending. */
  showCloseButton?: boolean
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel = "Cancel",
  confirmLabel,
  pendingLabel,
  confirmVariant = "default",
  isPending = false,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  contentClassName,
  showCloseButton = !isPending,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(contentClassName)}
        showCloseButton={showCloseButton}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description != null ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={isPending || confirmDisabled}
            onClick={onConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {pendingLabel ?? confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
