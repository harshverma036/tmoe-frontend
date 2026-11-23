import React from "react"
import Link from "next/link"

import { DashboardSidebarNav } from "@/components/layout/dashboard-sidebar-nav"
import { DashboardTopBarContainer } from "@/components/layout/dashboard-top-bar-container"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
    Sidebar,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarLogo } from "@/components/layout/sidebar-logo"
import appConfig from "@/lib/appConfig"
import { BRAND_LOGO_COOKIE, parseBrandLogo } from "@/lib/brand-logo"
import { cookies } from 'next/headers';

const layout = async ({
    children,
}: {
    children: React.ReactNode
}) => {
    const userInfo = await cookies()
    const userInfoData = userInfo.get(appConfig.cookies.userInfoKey);
    const user = userInfoData ? JSON.parse(userInfoData?.value || "{}") : null
    const brandLogo = parseBrandLogo(userInfo.get(BRAND_LOGO_COOKIE)?.value)

    return (
        <TooltipProvider>
            <SidebarProvider>
                <Sidebar collapsible="icon" variant="inset">
                    <SidebarHeader className="flex h-14 shrink-0 flex-col items-center justify-center gap-0 border-b p-0 px-4">
                        <Link
                            href="/insights"
                            className="flex w-full items-center justify-center overflow-hidden rounded-md outline-none ring-sidebar-ring focus-visible:ring-2"
                        >
                            <SidebarLogo role={user?.role} initialBrand={brandLogo} />
                        </Link>
                    </SidebarHeader>

                    <DashboardSidebarNav userRole={user?.role} />

                    <SidebarRail />
                </Sidebar>

                <SidebarInset className="bg-background">
                    <DashboardTopBarContainer user={user} />

                    <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}

export default layout
