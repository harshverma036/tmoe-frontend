import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Campaign } from "@/lib/campaign.types"
import { searchIntentLabel } from "@/lib/search-intent"

type Props = {
  campaign: Pick<
    Campaign,
    "primary_keywords" | "secondary_keywords" | "search_intent"
  >
  compact?: boolean
}

export function CampaignAeoSection({ campaign, compact }: Props) {
  const primary = campaign.primary_keywords ?? []
  const secondary = campaign.secondary_keywords ?? []
  const hasAeo =
    primary.length > 0 || secondary.length > 0 || Boolean(campaign.search_intent)

  if (!hasAeo) {
    if (compact) return null
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AEO optimization</CardTitle>
          <CardDescription>No AEO details provided for this campaign.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2 text-sm">
        {primary.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {primary.slice(0, 5).map((kw) => (
              <Badge key={kw} variant="secondary" className="font-normal">
                {kw}
              </Badge>
            ))}
            {primary.length > 5 ? (
              <Badge variant="outline" className="font-normal">
                +{primary.length - 5} more
              </Badge>
            ) : null}
          </div>
        ) : null}
        {campaign.search_intent ? (
          <p className="text-muted-foreground">
            Intent: {searchIntentLabel(campaign.search_intent)}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AEO optimization</CardTitle>
        <CardDescription>
          Answer engine optimization keywords and search intent for content
          planning.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {primary.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Primary keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {primary.map((kw) => (
                <Badge key={kw} variant="secondary" className="font-normal">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {secondary.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Secondary keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {secondary.map((kw) => (
                <Badge key={kw} variant="outline" className="font-normal">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Search intent
          </p>
          <p className="text-sm font-medium">
            {searchIntentLabel(campaign.search_intent)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
