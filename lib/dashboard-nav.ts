import {
  CalendarDays,
  LayoutDashboard,
  LineChart,
  Link2,
  Megaphone,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

/** Roles used for dashboard access control (aligned with auth / user cookie). */
export enum UserRole {
  ADMIN = "ADMIN",
  PUBLISHER = "PUBLISHER",
  BRAND = "BRAND",
}

export const ALL_USER_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.PUBLISHER,
  UserRole.BRAND,
]

export interface DashboardNavItem {
  label: string
  href: string
  icon: LucideIcon
  allowed_roles: UserRole[]
}

export const dashboardNavItems: DashboardNavItem[] = [
  {
    label: "Dashboard",
    href: "/insights",
    icon: LayoutDashboard,
    allowed_roles: ALL_USER_ROLES,
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    allowed_roles: [UserRole.ADMIN],
  },
  {
    label: "Slots",
    href: "/content-slots",
    icon: CalendarDays,
    allowed_roles: [UserRole.PUBLISHER],
  },
  {
    label: "Campaigns",
    href: "/campaign",
    icon: Megaphone,
    allowed_roles: [UserRole.ADMIN, UserRole.BRAND, UserRole.PUBLISHER],
  },
  {
    label: "Promote Links",
    href: "/promote-links",
    icon: Link2,
    allowed_roles: [UserRole.ADMIN, UserRole.PUBLISHER],
  },
  {
    label: "ROI Benchmarks",
    href: "/roi-benchmarks",
    icon: LineChart,
    allowed_roles: [UserRole.ADMIN],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    allowed_roles: ALL_USER_ROLES,
  },
]

export function normalizeUserRole(
  role: string | null | undefined
): UserRole | null {
  if (role == null || role === "") return null
  const upper = role.toUpperCase()
  if (
    upper === UserRole.ADMIN ||
    upper === UserRole.PUBLISHER ||
    upper === UserRole.BRAND
  ) {
    return upper as UserRole
  }
  return null
}

/** Sidebar entries visible for the given role (defaults to PUBLISHER if unknown). */
export function getDashboardNavItemsForRole(
  role: string | null | undefined
): DashboardNavItem[] {
  const resolved = normalizeUserRole(role) ?? UserRole.PUBLISHER
  return dashboardNavItems.filter((item) =>
    item.allowed_roles.includes(resolved)
  )
}

export function dashboardNavMatchesPath(pathname: string, href: string) {
  if (pathname === href) return true
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true
  return false
}

/** Label for the top bar; prefers the longest matching nav prefix (nested routes). */
export function getDashboardPageTitle(
  pathname: string,
  userRole?: string | null
) {
  const items = getDashboardNavItemsForRole(userRole)
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length)
  for (const item of sorted) {
    if (dashboardNavMatchesPath(pathname, item.href)) return item.label
  }
  return "Dashboard"
}
