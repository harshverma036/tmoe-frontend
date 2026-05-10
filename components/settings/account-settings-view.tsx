"use client"

import {
  ACCOUNT_SETTINGS_SECTION_IDS,
  ACCOUNT_SETTINGS_SECTIONS,
} from "@/lib/settings-sections"
import type { PersonalInformationValues } from "@/lib/validation/settings-forms"

import { BankDetailsForm } from "./bank-details-form"
import { PersonalInformationForm } from "./personal-information-form"
import { ProfileInformationForm } from "./profile-information-form"
import { SetPasswordForm } from "./set-password-form"
import { SettingsSectionNav } from "./settings-section-nav"
import { useActiveSettingsSection } from "./use-active-settings-section"

type AccountSettingsViewProps = {
  initialPersonal: PersonalInformationValues
}

export function AccountSettingsView({ initialPersonal }: AccountSettingsViewProps) {
  const { activeId, selectSection } = useActiveSettingsSection(
    ACCOUNT_SETTINGS_SECTION_IDS
  )

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Account settings
      </h1>

      <div className="flex flex-col-reverse gap-8 lg:flex-row lg:gap-12">
        <div className="min-w-0 flex-1 space-y-8">
          <PersonalInformationForm initialValues={initialPersonal} />
          <ProfileInformationForm />
          <BankDetailsForm />
          <SetPasswordForm />
        </div>

        <aside className="shrink-0 lg:w-52">
          <SettingsSectionNav
            sections={ACCOUNT_SETTINGS_SECTIONS}
            activeId={activeId}
            onSelectSection={selectSection}
          />
        </aside>
      </div>
    </div>
  )
}
