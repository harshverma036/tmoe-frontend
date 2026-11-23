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
import {
    BRAND_REPORT_SCOPE_PATH,
    normalizeBrandReportScope,
} from "@/lib/api/brand-report-scope"
import { cookies } from 'next/headers';

type SidebarLogo = { src: string; alt: string; width: number; height: number }

const TMOE_LOGO: SidebarLogo = { src: "/tmoe.svg", alt: "TMOE", width: 226, height: 131 }
const AGODA_LOGO: SidebarLogo = { src: "/brands/agoda.svg", alt: "Agoda", width: 600, height: 309 }

/**
 * The Agoda brand's account shows the Agoda logo in place of TMOE's. Looked up on the server so
 * the right logo is there on first paint; any failure falls back to TMOE's.
 */
async function sidebarLogo(role: string | undefined, token: string | undefined): Promise<SidebarLogo> {
    if (role?.toUpperCase() !== "BRAND" || !token || !appConfig.apiHost) return TMOE_LOGO
    try {
        const response = await fetch(`${appConfig.apiHost}${BRAND_REPORT_SCOPE_PATH}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
            signal: AbortSignal.timeout(3000),
        })
        if (!response.ok) return TMOE_LOGO
        const body = await response.json()
        return normalizeBrandReportScope(body?.data)?.is_agoda ? AGODA_LOGO : TMOE_LOGO
    } catch {
        return TMOE_LOGO
    }
}

const layout = async ({
    children,
}: {
    children: React.ReactNode
}) => {
    const userInfo = await cookies()
    const userInfoData = userInfo.get(appConfig.cookies.userInfoKey);
    const user = userInfoData ? JSON.parse(userInfoData?.value || "{}") : null
    const logo = await sidebarLogo(user?.role, userInfo.get(appConfig.cookies.userTokenKey)?.value)

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
                                src={logo.src}
                                alt={logo.alt}
                                width={logo.width}
                                height={logo.height}
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
