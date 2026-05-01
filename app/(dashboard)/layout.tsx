import React from "react"
import Link from "next/link"
import { LayoutDashboard, Settings, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import {        
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const navItems = [
  { label: "Dashboard", href: "/insights", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
]

const layout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader className="flex h-14 items-center border-b px-4 py-0">
            <h2 className="text-lg font-semibold tracking-wide">TMOE</h2>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Harsh Vardhan</p>
              <p className="text-xs text-muted-foreground">harsh@example.com</p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Logout
            </Button>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="bg-background/95 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-medium sm:text-base">Dashboard</h1>
          </header>

          <div className="flex-1 p-4 sm:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default layout