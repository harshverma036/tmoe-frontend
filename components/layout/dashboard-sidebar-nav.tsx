"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react"

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/insights", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
]

function navMatchesPath(pathname: string, href: string) {
  if (pathname === href) return true
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true
  return false
}

export function DashboardSidebarNav() {
  const pathname = usePathname()

  return (
    <SidebarContent className="gap-0 px-3 py-5">
      <SidebarMenu className="gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = navMatchesPath(pathname, item.href)
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={item.label}
                size="lg"
                className={cn(
                  "h-11 px-3 py-2 text-[15px] transition-colors",
                  "group-data-[collapsible=icon]:size-9!",
                  /* Active: soft primary wash, no outline — reads as one piece with the sidebar. */
                  "data-active:border-transparent data-active:bg-primary/16 data-active:font-semibold data-active:text-primary data-active:shadow-none",
                  "data-active:[&_svg]:text-primary",
                  "dark:data-active:border-transparent dark:data-active:bg-primary/24 dark:data-active:text-primary",
                  "dark:data-active:[&_svg]:text-primary"
                )}
              >
                <Link href={item.href}>
                  <Icon className="size-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarContent>
  )
}
