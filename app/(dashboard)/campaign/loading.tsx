import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function CampaignLoading() {
  return <LoadingSkeleton variant="card-grid" cardCount={6} />
}
