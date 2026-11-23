/** Brands whose account shows their own logo in place of TMOE's. */
export type BrandLogo = "agoda"

/** Remembers the signed-in brand's logo, so the server-rendered layout can show it at once. */
export const BRAND_LOGO_COOKIE = "tmoe_brand_logo"

export function parseBrandLogo(value: string | undefined): BrandLogo | null {
  return value === "agoda" ? "agoda" : null
}
