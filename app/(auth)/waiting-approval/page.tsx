"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import apiConfig from "@/lib/apiConfig"
import appConfig from "@/lib/appConfig"
import { mergeUserInfoCookie } from "@/lib/update-cookie"

/** Payload nested under `data` from GET /api/users/single */
type SingleUser = {
  id: string
  name: string
  email: string
  email_verified_at: string | null
  role: string
  admin_approved: boolean
  active: boolean
  profile_completed: boolean
  createdAt: string
  updatedAt: string
}

/** Poll cadence while the tab stays visible (see `refetchIntervalInBackground`). */
const APPROVAL_POLL_INTERVAL_MS = 60 * 1000

const WaitingApproval = () => {
  const router = useRouter()

  // Only run the query in the browser once we can read the auth cookie (apiConfig adds Bearer automatically).
  const canFetchUser =
    typeof document !== "undefined" &&
    Boolean(Cookies.get(appConfig.cookies.userTokenKey))

  const { data: user } = useQuery({
    queryKey: ["users", "single", "waiting-approval"],
    enabled: canFetchUser,
    queryFn: async () => {
      const response = await apiConfig.get<{ data: SingleUser }>(
        "/api/users/single"
      )
      return response?.data?.data
    },
    // Re-fetch every minute; TanStack Query pauses the timer while the tab is in the background when this is false.
    refetchInterval: APPROVAL_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    // Always treat polling results as eligible to refetch on each tick (global staleTime is 60s).
    staleTime: 0,
    retry: false,
  })

  // Mirror middleware: full access once both flags are true — sync cookie and exit this route.
  useEffect(() => {
    if (!user?.admin_approved || !user?.active) return

    mergeUserInfoCookie(user as Record<string, unknown>)
    router.replace("/insights")
  }, [router, user])

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    router.replace("/sign-in")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Approval Pending
          </div>
          <CardTitle>Your account is under review</CardTitle>
          <CardDescription>
            Your brand profile has been created successfully and sent to the
            admin team for verification. You will get dashboard access once it
            is approved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {/* Confirms the approval poll is active without exposing API details */}
          <p className="text-xs text-muted-foreground">
            Checking approval status every minute while this tab is open.
          </p>
          <div className="rounded-md border bg-muted/40 p-4">
            <p className="font-medium text-foreground">What happens next?</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Admin reviews your submitted details.</li>
              <li>
                After approval, dashboard access is enabled automatically.
              </li>
              <li>If anything is missing, the team may reach out to you.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="mailto:support@tmoe.com">Contact support</Link>
          </Button>
          <Button
            variant="secondary"
            className="w-full cursor-pointer sm:w-auto"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default WaitingApproval
