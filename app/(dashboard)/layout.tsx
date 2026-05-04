import React from "react"
import Image from "next/image"
import Link from "next/link"

import { DashboardSidebarNav } from "@/components/layout/dashboard-sidebar-nav"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
    Sidebar,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import appConfig from "@/lib/appConfig"
import { cookies } from 'next/headers';
import _ from 'lodash'

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
                    <SidebarHeader className="flex min-h-16 items-center justify-center border-b px-4 py-4">
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

                    <DashboardSidebarNav />

                    <SidebarFooter className="border-t p-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">{_.capitalize(user?.name as string)}</p>
                            <p className="text-xs text-muted-foreground">{user?.email as string}</p>
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