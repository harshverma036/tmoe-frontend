import apiConfig from "@/lib/apiConfig"

import type {
  BankDetailsValues,
  PersonalInformationValues,
  ProfileInformationFormValues,
  RssFeedValues,
} from "@/lib/validation/settings-forms"

export const publisherProfileMeQueryKey = ["publisher-profile", "me"] as const

// export type PublisherBankDetailRow = {
//   id: string
//   publisher_profile_id: string
//   bank_name: string
//   ifsc_code: string
//   account_no: string
//   holder_name: string
//   createdAt: string
//   updatedAt: string
// }

// export type PublisherProfileMe = {
//   id: string
//   user_id: string
//   website_url: string | null
//   publication_name: string | null
//   description: string | null
//   regions_covered: string[]
//   content_categories: string[]
//   monthly_sessions: number | null
//   page_views: number | null
//   rss_feed_url: string | null
//   updatedAt: string
//   publisherBandDetails: PublisherBankDetailRow[]
//   user: {
//     name: string
//     id: string
//     email: string
//     role: string
//   }
// }

// type PublisherProfileMeApiEnvelope = {
//   data: PublisherProfileMe
//   message: string
// }

export type PublisherProfileSettingsInitials = {
  personal: PersonalInformationValues
  profile: Partial<ProfileInformationFormValues>
  rss: Partial<RssFeedValues>
  bank: Partial<BankDetailsValues>
}

export async function fetchPublisherProfileMe(): Promise<any> {
  const { data } = await apiConfig.get<any>("/api/publisher/profile/me")
  return data.data
}

export function mapPublisherProfileToSettingsInitials(
  profile: any
): PublisherProfileSettingsInitials {
  const bankRow = profile.publisherBandDetails?.[0]

  return {
    personal: {
      name: profile.user?.name ?? "",
      email: profile.user?.email ?? "",
    },
    profile: {
      website_url: profile.website_url ?? undefined,
      publication_name: profile.publication_name ?? undefined,
      description: profile.description ?? undefined,
      regions_covered: profile.regions_covered ?? [],
      content_categories: profile.content_categories ?? [],
      monthly_sessions: profile.monthly_sessions ?? undefined,
      page_views: profile.page_views ?? undefined,
    },
    rss: {
      rss_feed_url: profile.rss_feed_url ?? undefined,
    },
    bank: bankRow
      ? {
          bank_name: bankRow.bank_name,
          ifsc_code: bankRow.ifsc_code,
          account_no: bankRow.account_no,
          holder_name: bankRow.holder_name,
        }
      : {},
  }
}
