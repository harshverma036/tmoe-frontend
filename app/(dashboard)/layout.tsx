import React from "react"
import Image from "next/image"
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

                <SidebarInset className="bg-background">
                    <DashboardTopBarContainer user={user} />

                    <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}

export default layout
