import apiConfig from "@/lib/apiConfig"

import type { PersonalInformationValues, SetPasswordValues } from "@/lib/validation/settings-forms"

const PATHS = {
  personal: "/api/users/me/personal",
  resetPassword: "/api/users/reset-password",
} as const

export async function updatePersonalInformation(
  body: PersonalInformationValues
): Promise<unknown> {
  const { data } = await apiConfig.patch<unknown>(PATHS.personal, body)
  return data
}

export async function updatePassword(body: SetPasswordValues): Promise<unknown> {
  const { data } = await apiConfig.put<unknown>(PATHS.resetPassword, {
    old_password: body.old_password,
    new_password: body.new_password,
  })
  return data
}
