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

export const CONTENT_PLACEMENT_POSITIONS: {
  value: ContentPlacementPosition
  label: string
  description: string
}[] = [
  {
    value: "HERO",
    label: "Hero / Top banner",
    description: "Full-width area at the top of the page",
  },
  {
    value: "LEFT",
    label: "Left column",
    description: "Left rail beside the main article",
  },
  {
    value: "RIGHT",
    label: "Right column",
    description: "Right rail beside the main article",
  },
  {
    value: "CENTER",
    label: "Center / Main content",
    description: "Primary content column in the article body",
  },
  {
    value: "FIRST_SCROLL",
    label: "First scroll",
    description: "Below the fold — visible after the first scroll",
  },
  {
    value: "IN_ARTICLE",
    label: "In-article embed",
    description: "Embedded block within the article text",
  },
  {
    value: "SIDEBAR",
    label: "Sidebar widget",
    description: "Sticky or floating sidebar module",
  },
  {
    value: "CATEGORY_PAGE",
    label: "Category page",
    description: "Listing grid on category or tag pages",
  },
  {
    value: "FOOTER",
    label: "Footer strip",
    description: "Bottom of page above or within the footer",
  },
]

export function getPlacementLabel(position: ContentPlacementPosition | null | undefined) {
  if (!position) return "Not configured"
  return (
    CONTENT_PLACEMENT_POSITIONS.find((p) => p.value === position)?.label ?? position
  )
}

export function isPlacementConfigured(placement: ContentPlacement) {
  return Boolean(placement.position)
}
