export type AccountSettingsSectionId =
  | "settings-personal"
  | "settings-profile"
  | "settings-rss"
  | "settings-bank"
  | "settings-password"

export type AccountSettingsSection = {
  id: AccountSettingsSectionId
  /** Label shown in the right-hand navigator */
  navLabel: string
  /** Heading inside the card */
  cardTitle: string
}

export const ACCOUNT_SETTINGS_SECTIONS: AccountSettingsSection[] = [
  {
    id: "settings-personal",
    navLabel: "Personal",
    cardTitle: "Personal information",
  },
  {
    id: "settings-profile",
    navLabel: "Profile",
    cardTitle: "Profile information",
  },
  {
    id: "settings-rss",
    navLabel: "RSS feed",
    cardTitle: "RSS feed",
  },
  {
    id: "settings-bank",
    navLabel: "Bank details",
    cardTitle: "Bank details",
  },
  {
    id: "settings-password",
    navLabel: "Password",
    cardTitle: "Set password",
  },
]

export const ACCOUNT_SETTINGS_SECTION_IDS: AccountSettingsSectionId[] =
  ACCOUNT_SETTINGS_SECTIONS.map((s) => s.id)
