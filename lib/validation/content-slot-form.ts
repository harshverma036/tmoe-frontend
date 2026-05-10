import * as yup from "yup"

/** Single content slot as stored in the UI (mirrors future API shape). */
export type ContentSlot = {
  id: string
  createdAt: string
  updatedAt: string
  type: string
  category: string
  estimated_traffic: number
  monetisation_model: string
}

/** Values edited in the add / update dialog (no server-generated fields). */
export type ContentSlotFormValues = {
  type: string
  category: string
  estimated_traffic: number
  monetisation_model: string
}

/** Allowed slot types in the form (aligned with Select options in the UI). */
export const CONTENT_SLOT_TYPES = [
  "Article",
  "Video",
  "Podcast",
  "Newsletter",
  "Social",
] as const

/** Monetisation options for the slot form Select. */
export const MONETISATION_MODELS = [
  "CPM",
  "CPC",
  "Sponsored",
  "Affiliate",
  "Flat fee",
] as const

function numberFromInput(val: unknown, orig: unknown): number | undefined {
  if (orig === "" || orig === null || orig === undefined) return undefined
  const n = typeof val === "number" ? val : Number(orig)
  if (Number.isNaN(n)) return undefined
  return n
}

/** Yup schema shared by create and update flows. */
export const contentSlotFormSchema = yup.object({
  type: yup
    .string()
    .trim()
    .oneOf([...CONTENT_SLOT_TYPES], "Select a valid type")
    .required("Type is required"),
  category: yup.string().trim().required("Category is required"),
  estimated_traffic: yup
    .number()
    .transform((val, orig) => numberFromInput(val, orig))
    .required("Estimated traffic is required")
    .integer("Must be a whole number")
    .min(0, "Must be zero or greater"),
  monetisation_model: yup
    .string()
    .trim()
    .oneOf([...MONETISATION_MODELS], "Select a valid monetisation model")
    .required("Monetisation model is required"),
})
