"use client"

import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import {
  useForm,
  useWatch,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form"
import toast from "react-hot-toast"

import {
  PUBLISHER_CONTENT_CATEGORIES,
  PUBLISHER_REGIONS,
} from "@/lib/constants/publisher-profile-options"
import { updateProfileInformation } from "@/lib/api/user-settings"
import {
  profileInformationSchema,
  type ProfileInformationFormValues,
} from "@/lib/validation/settings-forms"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { SettingsCard } from "./settings-card"
import { ToggleStringMultiSelect } from "./toggle-string-multi-select"

const defaultProfileValues: ProfileInformationFormValues = {
  website_url: undefined,
  publication_name: undefined,
  description: undefined,
  regions_covered: [],
  content_categories: [],
  monthly_sessions: undefined,
  page_views: undefined,
}

type ProfileInformationFormProps = {
  initialValues?: Partial<ProfileInformationFormValues>
}

export function ProfileInformationForm({
  initialValues,
}: ProfileInformationFormProps) {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<ProfileInformationFormValues>({
    defaultValues: { ...defaultProfileValues, ...initialValues },
    resolver: yupResolver(
      profileInformationSchema
    ) as Resolver<ProfileInformationFormValues>,
    mode: "onTouched",
  })

  const selectedRegions = useWatch({ control, name: "regions_covered" }) ?? []
  const selectedCategories =
    useWatch({ control, name: "content_categories" }) ?? []

  const toggleMulti = (
    key: "regions_covered" | "content_categories",
    value: string
  ) => {
    const current = getValues(key) || []
    const next = current.includes(value)
      ? current.filter((item: string) => item !== value)
      : [...current, value]
    setValue(key, next, { shouldValidate: true, shouldTouch: true })
  }

  const { mutate, isPending } = useMutation({
    mutationFn: updateProfileInformation,
    onSuccess: (_, variables) => {
      toast.success("Profile information updated")
      reset(variables)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Could not update profile information"
      )
    },
  })

  const onSubmit: SubmitHandler<ProfileInformationFormValues> = (data) => {
    mutate(data)
  }

  return (
    <SettingsCard id="settings-profile" title="Profile information">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="profile-website">Website URL (optional)</Label>
          <Input
            id="profile-website"
            placeholder="https://yourpublication.com"
            {...register("website_url")}
            errorMessage={errors.website_url?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-publication">Publication name (optional)</Label>
          <Input
            id="profile-publication"
            placeholder="The Media Outlet"
            {...register("publication_name")}
            errorMessage={errors.publication_name?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-description">Description (optional)</Label>
          <Textarea
            id="profile-description"
            rows={4}
            placeholder="Describe your publication"
            {...register("description")}
            errorMessage={errors.description?.message}
          />
        </div>

        <ToggleStringMultiSelect
          label="Regions covered (optional)"
          options={PUBLISHER_REGIONS}
          selected={selectedRegions}
          onToggle={(v) => toggleMulti("regions_covered", v)}
          errorMessage={errors.regions_covered?.message}
        />

        <ToggleStringMultiSelect
          label="Content categories (optional)"
          options={PUBLISHER_CONTENT_CATEGORIES}
          selected={selectedCategories}
          onToggle={(v) => toggleMulti("content_categories", v)}
          errorMessage={errors.content_categories?.message}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="profile-monthly-sessions">
              Monthly sessions (optional)
            </Label>
            <Input
              id="profile-monthly-sessions"
              type="number"
              min={0}
              placeholder="0"
              {...register("monthly_sessions", { valueAsNumber: true })}
              errorMessage={errors.monthly_sessions?.message}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-page-views">Page views (optional)</Label>
            <Input
              id="profile-page-views"
              type="number"
              min={0}
              placeholder="0"
              {...register("page_views", { valueAsNumber: true })}
              errorMessage={errors.page_views?.message}
            />
          </div>
        </div>

        <Button type="submit" disabled={!isValid || isPending}>
          {isPending ? "Saving…" : "Update Profile Information"}
        </Button>
      </form>
    </SettingsCard>
  )
}
