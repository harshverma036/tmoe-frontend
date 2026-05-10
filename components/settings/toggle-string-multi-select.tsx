"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type ToggleStringMultiSelectProps = {
  label: string
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
  errorMessage?: string
}

/**
 * Same interaction pattern as publisher onboarding: outline pills that toggle on/off.
 */
export function ToggleStringMultiSelect({
  label,
  options,
  selected,
  onToggle,
  errorMessage,
}: ToggleStringMultiSelectProps) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isOn = selected.includes(option)
          return (
            <Button
              key={option}
              type="button"
              variant={isOn ? "default" : "outline"}
              size="sm"
              onClick={() => onToggle(option)}
            >
              {option}
            </Button>
          )
        })}
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-500">{errorMessage}</p>
      ) : null}
    </div>
  )
}
