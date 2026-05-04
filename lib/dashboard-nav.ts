import { LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react"

export const dashboardNavItems: {
  label: string
  href: string
  icon: LucideIcon
}[] = [
  { label: "Dashboard", href: "/insights", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function dashboardNavMatchesPath(pathname: string, href: string) {
  if (pathname === href) return true
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true
  return false
}

/** Label for the top bar; prefers the longest matching nav prefix (nested routes). */
export function getDashboardPageTitle(pathname: string) {
  const sorted = [...dashboardNavItems].sort(
    (a, b) => b.href.length - a.href.length
  )
  for (const item of sorted) {
    if (dashboardNavMatchesPath(pathname, item.href)) return item.label
  }
  return "Dashboard"
}
