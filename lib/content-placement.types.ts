export type ContentPlacementPosition =
  | "LEFT"
  | "RIGHT"
  | "CENTER"
  | "FIRST_SCROLL"
  | "CATEGORY_PAGE"
  | "HERO"
  | "SIDEBAR"
  | "FOOTER"
  | "IN_ARTICLE"
  | "GOOGLE"
  | "AEO"
  | "PUSH_NOTIFICATION"
  | "IN_APP"

/** On the publisher's page, or a channel that surfaces the content elsewhere. */
export type ContentPlacementGroup = "ON_SITE" | "CHANNEL"

export type ContentPlacement = {
  id: string
  name: string
  position: ContentPlacementPosition | null
  description?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ContentPlacementListResult = {
  items: ContentPlacement[]
  total: number
  page: number
  pageSize: number
}

export type CreateContentPlacementBody = {
  name: string
}

export type UpdateContentPlacementBody = {
  name?: string
  position?: ContentPlacementPosition
  description?: string
}

export const CONTENT_PLACEMENT_GROUPS: {
  value: ContentPlacementGroup
  label: string
}[] = [
  { value: "ON_SITE", label: "On-site" },
  { value: "CHANNEL", label: "Distribution channels" },
]

export const CONTENT_PLACEMENT_POSITIONS: {
  value: ContentPlacementPosition
  label: string
  description: string
  group: ContentPlacementGroup
}[] = [
  {
    value: "HERO",
    label: "Hero / Top banner",
    description: "Full-width area at the top of the page",
    group: "ON_SITE",
  },
  {
    value: "LEFT",
    label: "Left column",
    description: "Left rail beside the main article",
    group: "ON_SITE",
  },
  {
    value: "RIGHT",
    label: "Right column",
    description: "Right rail beside the main article",
    group: "ON_SITE",
  },
  {
    value: "CENTER",
    label: "Center / Main content",
    description: "Primary content column in the article body",
    group: "ON_SITE",
  },
  {
    value: "FIRST_SCROLL",
    label: "First scroll",
    description: "Below the fold — visible after the first scroll",
    group: "ON_SITE",
  },
  {
    value: "IN_ARTICLE",
    label: "In-article embed",
    description: "Embedded block within the article text",
    group: "ON_SITE",
  },
  {
    value: "SIDEBAR",
    label: "Sidebar widget",
    description: "Sticky or floating sidebar module",
    group: "ON_SITE",
  },
  {
    value: "CATEGORY_PAGE",
    label: "Category page",
    description: "Listing grid on category or tag pages",
    group: "ON_SITE",
  },
  {
    value: "FOOTER",
    label: "Footer strip",
    description: "Bottom of page above or within the footer",
    group: "ON_SITE",
  },
  {
    value: "GOOGLE",
    label: "Google",
    description: "Surfaced in Google Search, Discover or News",
    group: "CHANNEL",
  },
  {
    value: "AEO",
    label: "AEO / AI answers",
    description: "Cited in AI answers (ChatGPT, Perplexity, AI Overviews)",
    group: "CHANNEL",
  },
  {
    value: "PUSH_NOTIFICATION",
    label: "Push notification",
    description: "Sent as a publisher push notification",
    group: "CHANNEL",
  },
  {
    value: "IN_APP",
    label: "In app",
    description: "Featured inside the publisher's mobile app",
    group: "CHANNEL",
  },
]

export function getPlacementLabel(position: ContentPlacementPosition | null | undefined) {
  if (!position) return "Not configured"
  return (
    CONTENT_PLACEMENT_POSITIONS.find((p) => p.value === position)?.label ?? position
  )
}

export function isChannelPlacement(position: ContentPlacementPosition | null | undefined) {
  return (
    CONTENT_PLACEMENT_POSITIONS.find((p) => p.value === position)?.group === "CHANNEL"
  )
}

export function isPlacementConfigured(placement: ContentPlacement) {
  return Boolean(placement.position)
}
