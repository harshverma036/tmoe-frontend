"use client"

import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useEffect, useMemo } from "react"
import toast from "react-hot-toast"

import {
  brandProfileMeQueryKey,
  fetchBrandProfileMe,
  mapBrandProfileToSettingsInitials,
} from "@/lib/api/brand-profile"
import {
  fetchPublisherProfileMe,
  mapPublisherProfileToSettingsInitials,
  publisherProfileMeQueryKey,
} from "@/lib/api/publisher-profile"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { getPersonalInformationFromCookie } from "@/lib/user-info-cookie"

import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

import { BankDetailsForm } from "./bank-details-form"
import { BrandProfileInformationForm } from "./brand-profile-information-form"
import { PersonalInformationForm } from "./personal-information-form"
import { ProfileInformationForm } from "./profile-information-form"
import { RssFeedForm } from "./rss-feed-form"
import { SetPasswordForm } from "./set-password-form"

const emptyPersonal = { name: "", email: "" }

export function AccountSettingsView() {
  const { role, isReady } = useDashboardUserRole()

  const publisherQuery = useQuery({
    queryKey: publisherProfileMeQueryKey,
    queryFn: fetchPublisherProfileMe,
    enabled: isReady && role === UserRole.PUBLISHER,
  })

  const brandQuery = useQuery({
    queryKey: brandProfileMeQueryKey,
    queryFn: fetchBrandProfileMe,
    enabled: isReady && role === UserRole.BRAND,
  })

  useEffect(() => {
    if (!publisherQuery.isError || role !== UserRole.PUBLISHER) return
    const err = publisherQuery.error
    const msg =
      err instanceof AxiosError
        ? err.response?.data?.message ?? err.message
        : "Could not load account settings"
    toast.error(msg)
  }, [publisherQuery.isError, publisherQuery.error, role])

  useEffect(() => {
    if (!brandQuery.isError || role !== UserRole.BRAND) return
    const err = brandQuery.error
    const msg =
      err instanceof AxiosError
        ? err.response?.data?.message ?? err.message
        : "Could not load account settings"
    toast.error(msg)
  }, [brandQuery.isError, brandQuery.error, role])

  const showLoader =
    !isReady ||
    (role === UserRole.PUBLISHER && publisherQuery.isLoading) ||
    (role === UserRole.BRAND && brandQuery.isLoading)

  const personal = useMemo(() => {
    if (!isReady) return emptyPersonal
    if (role === UserRole.PUBLISHER && publisherQuery.data) {
      return mapPublisherProfileToSettingsInitials(publisherQuery.data).personal
    }
    if (role === UserRole.BRAND && brandQuery.data) {
      return mapBrandProfileToSettingsInitials(brandQuery.data).personal
    }
    return getPersonalInformationFromCookie()
  }, [isReady, role, publisherQuery.data, brandQuery.data])

  const profileInitial = useMemo(() => {
    if (role !== UserRole.PUBLISHER || !publisherQuery.data) return {}
    return mapPublisherProfileToSettingsInitials(publisherQuery.data).profile
  }, [role, publisherQuery.data])

  const rssInitial = useMemo(() => {
    if (role !== UserRole.PUBLISHER || !publisherQuery.data) return {}
    return mapPublisherProfileToSettingsInitials(publisherQuery.data).rss
  }, [role, publisherQuery.data])

  const bankInitial = useMemo(() => {
    if (role !== UserRole.PUBLISHER || !publisherQuery.data) return {}
    return mapPublisherProfileToSettingsInitials(publisherQuery.data).bank
  }, [role, publisherQuery.data])

  const brandProfileInitial = useMemo(() => {
    if (role !== UserRole.BRAND || !brandQuery.data) return undefined
    return mapBrandProfileToSettingsInitials(brandQuery.data).brand
  }, [role, brandQuery.data])

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        Account settings
      </h1>

      {showLoader ? (
        <LoadingSkeleton className="mt-2" label="Loading account settings…" />
      ) : (
        <div className="flex flex-col-reverse gap-8 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1 space-y-8">
            <PersonalInformationForm initialValues={personal} />

            {role === UserRole.PUBLISHER ? (
              <>
                <ProfileInformationForm initialValues={profileInitial} />
                <RssFeedForm initialValues={rssInitial} />
                <BankDetailsForm initialValues={bankInitial} />
              </>
            ) : null}

            {role === UserRole.BRAND && brandProfileInitial ? (
              <BrandProfileInformationForm initialValues={brandProfileInitial} />
            ) : null}

            <SetPasswordForm />
          </div>
        </div>
      )}
    </div>
  )
}
