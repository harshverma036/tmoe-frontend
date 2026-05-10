"use client"

import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

import { updatePersonalInformation } from "@/lib/api/user-settings"
import { mergeUserInfoCookie } from "@/lib/update-cookie"
import {
  personalInformationSchema,
  type PersonalInformationValues,
} from "@/lib/validation/settings-forms"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { SettingsCard } from "./settings-card"

type PersonalInformationFormProps = {
  initialValues: PersonalInformationValues
}

export function PersonalInformationForm({
  initialValues,
}: PersonalInformationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<PersonalInformationValues>({
    defaultValues: initialValues,
    resolver: yupResolver(personalInformationSchema),
    mode: "onTouched",
  })

  const { mutate, isPending } = useMutation({
    mutationFn: updatePersonalInformation,
    onSuccess: (_, variables) => {
      mergeUserInfoCookie({
        name: variables.name,
        email: variables.email,
      })
      toast.success("Personal information updated")
      reset(variables)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Could not update personal information"
      )
    },
  })

  return (
    <SettingsCard id="settings-personal" title="Personal information">
      <form
        onSubmit={handleSubmit((data) => mutate(data))}
        className="space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="personal-name">Name</Label>
            <Input
              id="personal-name"
              autoComplete="name"
              {...register("name")}
              errorMessage={errors.name?.message}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="personal-email">Email</Label>
            <Input
              id="personal-email"
              type="email"
              autoComplete="email"
              disabled
              {...register("email")}
              errorMessage={errors.email?.message}
            />
          </div>
        </div>
        <Button type="submit" disabled={!isValid || isPending}>
          {isPending ? "Saving…" : "Update Personal Information"}
        </Button>
      </form>
    </SettingsCard>
  )
}
