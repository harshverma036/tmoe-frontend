import type { SearchIntent } from "@/lib/campaign.types"

export const SEARCH_INTENT_OPTIONS: {
  value: SearchIntent
  label: string
}[] = [
  { value: "INFORMATIONAL", label: "Informational" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "TRANSACTIONAL", label: "Transactional" },
  { value: "NAVIGATIONAL", label: "Navigational" },
]

export function searchIntentLabel(intent: SearchIntent | null | undefined): string {
  if (!intent) return "—"
  const found = SEARCH_INTENT_OPTIONS.find((o) => o.value === intent)
  return found?.label ?? intent.charAt(0) + intent.slice(1).toLowerCase()
}
