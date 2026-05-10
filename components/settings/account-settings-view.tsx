"use client"

import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useEffect, useMemo } from "react"
import toast from "react-hot-toast"

import {
    fetchPublisherProfileMe,
    mapPublisherProfileToSettingsInitials,
    publisherProfileMeQueryKey,
} from "@/lib/api/publisher-profile"

import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

import { BankDetailsForm } from "./bank-details-form"
import { PersonalInformationForm } from "./personal-information-form"
import { ProfileInformationForm } from "./profile-information-form"
import { RssFeedForm } from "./rss-feed-form"
import { SetPasswordForm } from "./set-password-form"

const emptyPersonal = { name: "", email: "" }

export function AccountSettingsView() {
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: publisherProfileMeQueryKey,
    queryFn: fetchPublisherProfileMe,
  })

  useEffect(() => {
    if (!isError) return
    const msg =
      error instanceof AxiosError
        ? error.response?.data?.message ?? error.message
        : "Could not load account settings"
    toast.error(msg)
  }, [isError, error])

  const initials = useMemo(
    () => (profile ? mapPublisherProfileToSettingsInitials(profile) : null),
    [profile]
  )

  const personal = initials?.personal ?? emptyPersonal
  const profileInitial = initials?.profile ?? {}
  const rssInitial = initials?.rss ?? {}
  const bankInitial = initials?.bank ?? {}

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Account settings
      </h1>

      {isLoading ? (
        <LoadingSkeleton className="mt-2" label="Loading account settings…" />
      ) : (
        <div className="flex flex-col-reverse gap-8 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1 space-y-8">
            <PersonalInformationForm initialValues={personal} />
            <ProfileInformationForm initialValues={profileInitial} />
            <RssFeedForm initialValues={rssInitial} />
            <BankDetailsForm initialValues={bankInitial} />
            <SetPasswordForm />
          </div>

          {/* <aside className="shrink-0 lg:w-52">
          <SettingsSectionNav
            sections={ACCOUNT_SETTINGS_SECTIONS}
            activeId={activeId}
            onSelectSection={selectSection}
          />
        </aside> */}
        </div>
      )}
    </div>
  )
}
