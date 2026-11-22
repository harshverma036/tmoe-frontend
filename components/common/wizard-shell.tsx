"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { cn } from "@/lib/utils"

export type WizardStep = {
  id: string
  label: string
  description?: string
}

type WizardShellProps = {
  breadcrumbs?: React.ReactNode
  title: string
  stepSubtitle: string
  steps: WizardStep[]
  currentStep: number
  onStepChange?: (index: number) => void
  headerActions?: React.ReactNode
  sidebarFooter?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

function stepProgressPercent(currentStep: number, totalSteps: number) {
  if (totalSteps <= 0) return 0
  return Math.round((currentStep / totalSteps) * 100)
}

export function WizardShell({
  breadcrumbs,
  title,
  stepSubtitle,
  steps,
  currentStep,
  onStepChange,
  headerActions,
  sidebarFooter,
  children,
  footer,
  className,
}: WizardShellProps) {
  const progress = stepProgressPercent(currentStep, steps.length)

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        description={stepSubtitle}
        actions={headerActions}
      />

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs sm:p-5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Brief progress
            </p>
            <nav className="mt-4 space-y-1" aria-label="Wizard steps">
              {steps.map((step, index) => {
                const isComplete = index < currentStep
                const isActive = index === currentStep
                const isClickable = Boolean(onStepChange)

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => onStepChange?.(index)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      isActive && "bg-primary/10",
                      isClickable && !isActive && "hover:bg-muted/60",
                      !isClickable && "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                        isComplete &&
                          "border-primary bg-primary text-primary-foreground",
                        isActive &&
                          !isComplete &&
                          "border-primary bg-primary/15 text-primary",
                        !isComplete &&
                          !isActive &&
                          "border-border bg-muted/40 text-muted-foreground",
                      )}
                    >
                      {isComplete ? (
                        <Check className="size-3" aria-hidden />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-sm leading-snug",
                          isActive
                            ? "font-medium text-primary"
                            : isComplete
                              ? "font-medium text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                      {step.description ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {step.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </nav>

            <div className="mt-5 space-y-2 border-t border-border/70 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium tabular-nums text-foreground">
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {sidebarFooter}
        </aside>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
            <div className="p-5 sm:p-6">{children}</div>
            {footer ? (
              <div className="border-t border-border/70 bg-muted/20 px-5 py-4 sm:px-6">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

type WizardStepHeaderProps = {
  stepNumber: number
  title: string
  description?: string
}

export function WizardStepHeader({
  stepNumber,
  title,
  description,
}: WizardStepHeaderProps) {
  return (
    <div className="mb-6 space-y-1.5 border-b border-border/70 pb-5">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
        Step {stepNumber}: {title}
      </p>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

type WizardFooterNavProps = {
  backLabel?: string
  onBack?: () => void
  backDisabled?: boolean
  secondaryAction?: React.ReactNode
  primaryAction: React.ReactNode
}

export function WizardFooterNav({
  backLabel,
  onBack,
  backDisabled = false,
  secondaryAction,
  primaryAction,
}: WizardFooterNavProps) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {backLabel && onBack ? (
        <ButtonBack
          label={backLabel}
          onClick={onBack}
          disabled={backDisabled}
        />
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {secondaryAction}
        {primaryAction}
      </div>
    </div>
  )
}

function ButtonBack({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      ← {label}
    </button>
  )
}
