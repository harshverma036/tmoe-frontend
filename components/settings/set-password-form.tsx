"use client"

import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

import { updatePassword } from "@/lib/api/user-settings"
import {
  setPasswordSchema,
  type SetPasswordValues,
} from "@/lib/validation/settings-forms"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { SettingsCard } from "./settings-card"

const emptyPassword: SetPasswordValues = {
  old_password: "",
  new_password: "",
  repeat_password: "",
}

export function SetPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<SetPasswordValues>({
    defaultValues: emptyPassword,
    resolver: yupResolver(setPasswordSchema),
    mode: "onTouched",
  })

  const { mutate, isPending } = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success("Password updated")
      reset(emptyPassword)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not update password")
    },
  })

  return (
    <SettingsCard id="settings-password" title="Set password">
      <form
        onSubmit={handleSubmit((data) => mutate(data))}
        className="space-y-6"
      >
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pwd-old">Current password</Label>
            <Input
              id="pwd-old"
              type="password"
              autoComplete="current-password"
              {...register("old_password")}
              errorMessage={errors.old_password?.message}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pwd-new">New password</Label>
            <Input
              id="pwd-new"
              type="password"
              autoComplete="new-password"
              {...register("new_password")}
              errorMessage={errors.new_password?.message}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pwd-repeat">Repeat new password</Label>
            <Input
              id="pwd-repeat"
              type="password"
              autoComplete="new-password"
              {...register("repeat_password")}
              errorMessage={errors.repeat_password?.message}
            />
          </div>
        </div>
        <Button type="submit" disabled={!isValid || isPending}>
          {isPending ? "Saving…" : "Update Password"}
        </Button>
      </form>
    </SettingsCard>
  )
}
