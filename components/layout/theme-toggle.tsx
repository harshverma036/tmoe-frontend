"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const label =
    resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 shrink-0"
      aria-label={mounted ? label : "Toggle color theme"}
      onClick={toggle}
    >
      {!mounted ? (
        <Moon className="size-4 opacity-40" aria-hidden />
      ) : resolvedTheme === "dark" ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  )
}
