import * as yup from "yup"

function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value
}

/** Mirrors optional `@IsUrl()` — omit or valid absolute URL. */
export const personalInformationSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  email: yup
    .string()
    .trim()
    .email("Enter a valid email")
    .required("Email is required"),
})

/** Publisher profile fields aligned with backend class-validator (optional fields). */
export const profileInformationSchema = yup.object({
  website_url: yup
    .string()
    .transform((v) => (typeof v === "string" ? emptyToUndefined(v) : v) as string | undefined)
    .optional()
    .url("Enter a valid website URL"),
  publication_name: yup
    .string()
    .transform((v) => (typeof v === "string" ? emptyToUndefined(v) : v) as string | undefined)
    .optional()
    .test(
      "non-empty-when-set",
      "Publication name cannot be empty",
      (v) => v == null || v.trim().length > 0
    ),
  description: yup
    .string()
    .transform((v) => (typeof v === "string" ? emptyToUndefined(v) : v) as string | undefined)
    .optional()
    .test(
      "non-empty-when-set",
      "Description cannot be empty",
      (v) => v == null || v.trim().length > 0
    ),
  regions_covered: yup
    .array()
    .of(yup.string().trim().min(1, "Each region must be non-empty"))
    .optional()
    .default([]),
  content_categories: yup
    .array()
    .of(yup.string().trim().min(1, "Each category must be non-empty"))
    .optional()
    .default([]),
  monthly_sessions: yup
    .number()
    .transform((val, orig) => {
      const o = orig as unknown
      if (o === "" || o === null || o === undefined || Number.isNaN(val))
        return undefined
      return val
    })
    .integer("Monthly sessions must be an integer")
    .min(0, "Monthly sessions must be at least 0")
    .optional(),
  page_views: yup
    .number()
    .transform((val, orig) => {
      const o = orig as unknown
      if (o === "" || o === null || o === undefined || Number.isNaN(val))
        return undefined
      return val
    })
    .integer("Page views must be an integer")
    .min(0, "Page views must be at least 0")
    .optional(),
})

export const bankDetailsSchema = yup.object({
  bank_name: yup.string().trim().required("Bank name is required"),
  ifsc_code: yup.string().trim().required("IFSC code is required"),
  account_no: yup.string().trim().required("Account number is required"),
  holder_name: yup.string().trim().required("Account holder name is required"),
})

export const setPasswordSchema = yup.object({
  old_password: yup.string().required("Current password is required"),
  new_password: yup.string().trim().required("New password is required"),
  repeat_password: yup
    .string()
    .trim()
    .required("Confirm your new password")
    .oneOf([yup.ref("new_password")], "Passwords must match"),
})

export const rssFeedSchema = yup.object({
  rss_feed_url: yup
    .string()
    .transform((v) => (typeof v === "string" ? emptyToUndefined(v) : v) as string | undefined)
    .optional()
    .url("Enter a valid RSS feed URL"),
})

export type PersonalInformationValues = yup.InferType<
  typeof personalInformationSchema
>

const commerceLinkRowSchema = yup.object({
  url: yup
    .string()
    .transform((v) =>
      typeof v === "string" && v.trim() === "" ? undefined : v
    )
    .optional()
    .url("Enter a valid URL"),
})

/** Brand profile section — optional fields align with backend `@IsOptional()` DTO. */
export const brandProfileInformationSchema = yup.object({
  brand_name: yup
    .string()
    .transform((v) => (typeof v === "string" ? emptyToUndefined(v) : v) as string | undefined)
    .optional()
    .test(
      "non-empty-when-set",
      "Brand name cannot be empty",
      (v) => v == null || v.trim().length > 0,
    ),
  description: yup
    .string()
    .transform((v) => (typeof v === "string" ? emptyToUndefined(v) : v) as string | undefined)
    .optional(),
  industry: yup
    .string()
    .transform((v) => (typeof v === "string" ? emptyToUndefined(v) : v) as string | undefined)
    .optional(),
  headquarters_location: yup
    .string()
    .transform((v) => (typeof v === "string" ? emptyToUndefined(v) : v) as string | undefined)
    .optional(),
  product_categories: yup
    .array()
    .of(yup.string().trim().min(1, "Each category must be non-empty"))
    .optional()
    .default([]),
  target_market_geo: yup
    .array()
    .of(yup.string().trim().min(1, "Each region must be non-empty"))
    .optional()
    .default([]),
  commerce_links: yup
    .array()
    .of(commerceLinkRowSchema)
    .optional()
    .default([]),
})

/** Explicit shape for RHF + brand PATCH (commerce rows mirror onboarding). */
export type BrandProfileInformationFormValues = {
  brand_name?: string
  description?: string
  industry?: string
  headquarters_location?: string
  product_categories: string[]
  target_market_geo: string[]
  commerce_links: { url: string }[]
}

/** Explicit shape for RHF + PATCH payload (yup infer is overly strict on optional keys). */
export type ProfileInformationFormValues = {
  website_url?: string
  publication_name?: string
  description?: string
  regions_covered: string[]
  content_categories: string[]
  monthly_sessions?: number
  page_views?: number
}

export type BankDetailsValues = yup.InferType<typeof bankDetailsSchema>
export type SetPasswordValues = yup.InferType<typeof setPasswordSchema>
export type RssFeedValues = yup.InferType<typeof rssFeedSchema>
