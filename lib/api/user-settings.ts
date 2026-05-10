import apiConfig from "@/lib/apiConfig"

import type {
  BankDetailsValues,
  PersonalInformationValues,
  ProfileInformationFormValues,
  RssFeedValues,
  SetPasswordValues,
} from "@/lib/validation/settings-forms"

/**
 * Adjust these paths to match your backend. Each section submits independently.
 */
const PATHS = {
  personal: "/api/users/me/personal",
  profile: "/api/users/me/profile",
  rssFeed: "/api/users/me/rss-feed",
  bank: "/api/users/me/bank",
  password: "/api/users/me/password",
} as const

export async function updatePersonalInformation(
  body: PersonalInformationValues
): Promise<unknown> {
  const { data } = await apiConfig.patch<unknown>(PATHS.personal, body)
  return data
}

export async function updateProfileInformation(
  body: ProfileInformationFormValues
): Promise<unknown> {
  const { data } = await apiConfig.patch<unknown>(PATHS.profile, body)
  return data
}

export async function updateRssFeed(body: RssFeedValues): Promise<unknown> {
  const { data } = await apiConfig.patch<unknown>(PATHS.rssFeed, body)
  return data
}

export async function updateBankDetails(body: BankDetailsValues): Promise<unknown> {
  const { data } = await apiConfig.patch<unknown>(PATHS.bank, body)
  return data
}

export async function updatePassword(body: SetPasswordValues): Promise<unknown> {
  const { data } = await apiConfig.post<unknown>(PATHS.password, {
    old_password: body.old_password,
    new_password: body.new_password,
  })
  return data
}
