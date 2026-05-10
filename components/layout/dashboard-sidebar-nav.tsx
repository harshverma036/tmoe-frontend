"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  dashboardNavMatchesPath,
  getDashboardNavItemsForRole,
} from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"

export function DashboardSidebarNav({
  userRole,
}: {
  userRole?: string | null
}) {
  const pathname = usePathname()
  const navItems = getDashboardNavItemsForRole(userRole)

  return (
    <SidebarContent className="gap-0 px-3 py-5">
      <SidebarMenu className="gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = dashboardNavMatchesPath(pathname, item.href)
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
                  /* Dark: --primary is too dark on tinted bg; use sidebar accent pair for contrast. */
                  "dark:data-active:border-transparent dark:data-active:bg-sidebar-accent dark:data-active:font-semibold dark:data-active:text-sidebar-accent-foreground dark:data-active:shadow-none",
                  "dark:data-active:[&_svg]:text-sidebar-accent-foreground"
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
