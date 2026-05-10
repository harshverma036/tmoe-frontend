import { cookies } from "next/headers"

import { AccountSettingsView } from "@/components/settings/account-settings-view"
import appConfig from "@/lib/appConfig"

export default async function SettingsPage() {
  const jar = await cookies()
  const raw = jar.get(appConfig.cookies.userInfoKey)?.value

  let initialPersonal = { name: "", email: "" }
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        "email" in parsed &&
        !Array.isArray(parsed)
      ) {
        const u = parsed as { name?: string; email?: string }
        initialPersonal = {
          name: typeof u.name === "string" ? u.name : "",
          email: typeof u.email === "string" ? u.email : "",
        }
      }
    } catch {
      // ignore malformed cookie
    }
  }

  return <AccountSettingsView initialPersonal={initialPersonal} />
}
