"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearAuthSession } from "@/lib/clear-auth-session"
import { cn } from "@/lib/utils"

export type DashboardUser = {
  name?: string | null
  email?: string | null
  role?: string | null
}

type DashboardUserMenuProps = {
  user: DashboardUser | null
  variant?: "avatar" | "inline"
  roleLabel?: string
}

function getFirstWordFromEmail(email: string | undefined | null): string {
  if (!email?.trim()) return ""
  const local = email.split("@")[0] ?? ""
  const firstSegment = local.split(/[._+]+/).filter(Boolean)[0]
  return firstSegment ?? local
}

function getAvatarMonogram(email: string | undefined | null): string {
  const word = getFirstWordFromEmail(email)
  if (!word) return "?"
  const upper = word.toUpperCase()
  return upper.length <= 4 ? upper : upper.slice(0, 3)
}

function formatDisplayName(name: string) {
  const t = name.trim()
  if (!t) return ""
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

function getInitials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return getAvatarMonogram(email)
}

export function DashboardUserMenu({
  user,
  variant = "avatar",
  roleLabel,
}: DashboardUserMenuProps) {
  const router = useRouter()

  const displayName = user?.name?.trim()
    ? formatDisplayName(String(user.name))
    : "Account"
  const email = user?.email ?? ""
  const monogram = getInitials(displayName, email)

  const handleLogout = () => {
    clearAuthSession()
    router.replace("/sign-in")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          variant === "inline" &&
            "flex items-center gap-3 border border-transparent px-1 py-1 hover:bg-muted/60"
        )}
        aria-label="Open account menu"
      >
        {variant === "inline" ? (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none text-foreground">
                {displayName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {roleLabel ?? "Account"}
              </p>
            </div>
            <Avatar className="size-9 border border-border/70">
              <AvatarFallback className="bg-[#f5ebe0] text-xs font-semibold text-foreground">
                {monogram}
              </AvatarFallback>
            </Avatar>
          </>
        ) : (
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
        )}
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

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
