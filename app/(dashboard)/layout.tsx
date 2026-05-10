import React from "react"
import Image from "next/image"
import Link from "next/link"

import { DashboardHeaderTitle } from "@/components/layout/dashboard-header-title"
import { DashboardSidebarNav } from "@/components/layout/dashboard-sidebar-nav"
import { DashboardUserMenu } from "@/components/layout/dashboard-user-menu"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
    Sidebar,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import appConfig from "@/lib/appConfig"
import { cookies } from 'next/headers';

const layout = async ({
    children,
}: {
    children: React.ReactNode
}) => {
    const userInfo = await cookies()
    const userInfoData = userInfo.get(appConfig.cookies.userInfoKey);
    const user = userInfoData ? JSON.parse(userInfoData?.value || "{}") : null

    return (
        <TooltipProvider>
            <SidebarProvider>
                <Sidebar collapsible="icon" variant="inset">
                    <SidebarHeader className="flex h-14 shrink-0 flex-col items-center justify-center gap-0 border-b p-0 px-4">
                        <Link
                            href="/insights"
                            className="flex w-full items-center justify-center overflow-hidden rounded-md outline-none ring-sidebar-ring focus-visible:ring-2"
                        >
                            <Image
                                src="/tmoe.svg"
                                alt="TMOE"
                                width={226}
                                height={131}
                                priority
                                className="h-11 w-auto max-w-[min(100%,10rem)] object-contain object-center group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:max-w-9"
                            />
                        </Link>
                    </SidebarHeader>

                    <DashboardSidebarNav userRole={user?.role} />

                    <SidebarRail />
                </Sidebar>

                <SidebarInset>
                    <header className="bg-background/95 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
                        <SidebarTrigger />
                        <DashboardHeaderTitle userRole={user?.role} />
                        <div className="ml-auto flex items-center gap-1">
                            <ThemeToggle />
                            <DashboardUserMenu user={user} />
                        </div>
                    </header>

                    <div className="flex-1 p-4 sm:p-6">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}

export default layout