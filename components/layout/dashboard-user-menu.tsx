"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useTheme } from "next-themes"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import appConfig from "@/lib/appConfig"

export type DashboardUser = {
  name?: string | null
  email?: string | null
}

/**
 * Parses the email local part (before @) and returns the first "word",
 * splitting on common separators so `john.doe@...` → `john`.
 */
function getFirstWordFromEmail(email: string | undefined | null): string {
  if (!email?.trim()) return ""
  const local = email.split("@")[0] ?? ""
  const firstSegment = local.split(/[._+]+/).filter(Boolean)[0]
  return firstSegment ?? local
}

/**
 * Avatar label: the first word from the email local part (uppercased).
 * Long local parts are clipped so the circle stays readable.
 */
function getAvatarMonogram(email: string | undefined | null): string {
  const word = getFirstWordFromEmail(email)
  if (!word) return "?"
  const upper = word.toUpperCase()
  // Full word when short; first three letters when the local part is long (e.g. harshverma0362).
  return upper.length <= 4 ? upper : upper.slice(0, 3)
}

/** Single-string title case (matches prior sidebar display). */
function formatDisplayName(name: string) {
  const t = name.trim()
  if (!t) return ""
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

type DashboardUserMenuProps = {
  user: DashboardUser | null
}

export function DashboardUserMenu({ user }: DashboardUserMenuProps) {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const displayName = user?.name?.trim()
    ? formatDisplayName(String(user.name))
    : "Account"
  const email = user?.email ?? ""
  const monogram = getAvatarMonogram(user?.email)

  const handleLogout = () => {
    Cookies.remove(appConfig.cookies.userTokenKey, { path: "/" })
    Cookies.remove(appConfig.cookies.userInfoKey, { path: "/" })
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      /* ignore quota / private mode */
    }
    router.replace("/sign-in")
  }

  /** Sub-trigger label: reflect current mode once the client has mounted. */
  const themeSummary = !mounted
    ? "…"
    : theme === "system"
      ? "System"
      : resolvedTheme === "dark"
        ? "Dark"
        : "Light"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open account menu"
      >
        <Avatar className="size-9">
          <AvatarFallback
            className={
              monogram.length > 1
                ? "px-0.5 text-[10px] font-semibold leading-none"
                : "text-sm font-medium"
            }
          >
            {monogram}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex flex-col space-y-1 px-2 py-1.5">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="text-xs leading-snug text-muted-foreground break-all">
              {email || "—"}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings">Account settings</Link>
        </DropdownMenuItem>

        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            Theme: {themeSummary}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={mounted ? theme : "light"}
              onValueChange={setTheme}
            >
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub> */}

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
