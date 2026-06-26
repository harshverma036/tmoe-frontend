import * as yup from "yup"

function numberFromInput(val: unknown, orig: unknown): number | undefined {
  if (orig === "" || orig === null || orig === undefined) return undefined
  const n = typeof val === "number" ? val : Number(orig)
  if (Number.isNaN(n)) return undefined
  return n
}

const categoryListSchema = yup
  .array()
  .of(
    yup
      .string()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .required()
      .min(1, "Invalid category"),
  )
  .min(1, "Select at least one target category")

const skuTagListSchema = yup
  .array()
  .of(
    yup
      .string()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .required()
      .min(1, "SKU cannot be empty"),
  )
  .min(1, "Add at least one SKU (press Enter after each)")

const urlList = yup
  .array()
  .of(
    yup
      .string()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .required("Link is required")
      .url("Each commerce link must be a valid URL"),
  )
  .min(1, "Add at least one commerce link")

export type CampaignBriefFormValues = {
  name: string
  target_category: string[]
  target_market: string
  product_skus: string[]
  budget_min: number
  budget_max: number
  gmv_target?: number
  roi_target?: number
  commerce_links: string[]
  submit_for_review: boolean
  description: string
  primary_keywords: string[]
  secondary_keywords: string[]
  search_intent?: string
}

export const campaignBriefEmptyValues: CampaignBriefFormValues = {
  name: "",
  target_category: [],
  target_market: "",
  product_skus: [],
  budget_min: undefined as unknown as number,
  budget_max: undefined as unknown as number,
  gmv_target: undefined,
  roi_target: undefined,
  commerce_links: [""],
  submit_for_review: false,
  description: "",
  primary_keywords: [],
  secondary_keywords: [],
  search_intent: "",
}

/** Create flow — matches POST `/api/campaign` contract. */
export const campaignBriefCreateSchema = yup
  .object({
    name: yup.string().trim().required("Campaign name is required"),
    target_category: categoryListSchema,
    target_market: yup.string().trim().required("Target market is required"),
    product_skus: skuTagListSchema,
    budget_min: yup
      .number()
      .transform((val, orig) => numberFromInput(val, orig))
      .required("Minimum budget is required")
      .integer("Budget must be a whole number")
      .min(0, "Budget cannot be negative"),
    budget_max: yup
      .number()
      .transform((val, orig) => numberFromInput(val, orig))
      .required("Maximum budget is required")
      .integer("Budget must be a whole number")
      .min(0, "Budget cannot be negative"),
    gmv_target: yup
      .number()
      .transform((val, orig) => numberFromInput(val, orig))
      .integer("GMV target must be a whole number")
      .optional(),
    roi_target: yup
      .number()
      .transform((val, orig) => numberFromInput(val, orig))
      .optional(),
    commerce_links: urlList,
    submit_for_review: yup.boolean().default(false),
    description: yup.string().trim().optional().default(""),
    primary_keywords: yup.array().of(yup.string().trim()).default([]),
    secondary_keywords: yup.array().of(yup.string().trim()).default([]),
    search_intent: yup.string().trim().optional().default(""),
  })
  .test(
    "budget-range",
    "Maximum budget must be greater than or equal to minimum budget",
    (vals) => {
      if (vals?.budget_min == null || vals?.budget_max == null) return true
      return vals.budget_max >= vals.budget_min
    },
  )
  .test(
    "gmv-or-roi",
    "Provide a GMV target and/or an ROI target",
    (vals) => {
      const g = vals?.gmv_target
      const r = vals?.roi_target
      const hasG = g !== undefined && g !== null && !Number.isNaN(g)
      const hasR = r !== undefined && r !== null && !Number.isNaN(r)
      return hasG || hasR
    },
  )
