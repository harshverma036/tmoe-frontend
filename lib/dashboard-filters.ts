export type DashboardDateRange = "" | "30" | "90"

export type DashboardSearchField = "all" | "name" | "email" | "role"

export type DashboardModuleId =
  | "users"
  | "campaigns"
  | "promote-links"
  | "roi-benchmarks"
  | "content-slots"
  | "insights"
  | "settings"

export type DashboardModuleFilterConfig = {
  searchEnabled: boolean
  dateRangeEnabled: boolean
  searchPlaceholder: string
  searchFields: { value: DashboardSearchField; label: string }[]
}

export const DASHBOARD_MODULE_FILTERS: Record<
  DashboardModuleId,
  DashboardModuleFilterConfig
> = {
  users: {
    searchEnabled: true,
    dateRangeEnabled: true,
    searchPlaceholder: "Search users by name, email, or role...",
    searchFields: [
      { value: "all", label: "All fields" },
      { value: "name", label: "Name" },
      { value: "email", label: "Email" },
      { value: "role", label: "Role" },
    ],
  },
  campaigns: {
    searchEnabled: true,
    dateRangeEnabled: true,
    searchPlaceholder: "Search campaigns...",
    searchFields: [{ value: "all", label: "All fields" }],
  },
  "promote-links": {
    searchEnabled: true,
    dateRangeEnabled: true,
    searchPlaceholder: "Search promote links...",
    searchFields: [{ value: "all", label: "All fields" }],
  },
  "roi-benchmarks": {
    searchEnabled: true,
    dateRangeEnabled: false,
    searchPlaceholder: "Search ROI benchmarks...",
    searchFields: [{ value: "all", label: "All fields" }],
  },
  "content-slots": {
    searchEnabled: true,
    dateRangeEnabled: true,
    searchPlaceholder: "Search content slots...",
    searchFields: [{ value: "all", label: "All fields" }],
  },
  insights: {
    searchEnabled: false,
    dateRangeEnabled: true,
    searchPlaceholder: "Search...",
    searchFields: [{ value: "all", label: "All fields" }],
  },
  settings: {
    searchEnabled: false,
    dateRangeEnabled: false,
    searchPlaceholder: "Search...",
    searchFields: [{ value: "all", label: "All fields" }],
  },
}

export function getDashboardModuleFromPath(
  pathname: string
): DashboardModuleId | null {
  if (pathname.startsWith("/users")) return "users"
  if (pathname.startsWith("/campaign")) return "campaigns"
  if (pathname.startsWith("/promote-links")) return "promote-links"
  if (pathname.startsWith("/roi-benchmarks")) return "roi-benchmarks"
  if (pathname.startsWith("/content-slots")) return "content-slots"
  if (pathname.startsWith("/insights")) return "insights"
  if (pathname.startsWith("/settings")) return "settings"
  return null
}

export function getDateRangeLabel(dateRange: DashboardDateRange) {
  switch (dateRange) {
    case "30":
      return "Last 30 days"
    case "90":
      return "Last 90 days"
    default:
      return "All time"
  }
}
