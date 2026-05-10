"use client"

import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

import { updateBankDetails } from "@/lib/api/user-settings"
import {
  bankDetailsSchema,
  type BankDetailsValues,
} from "@/lib/validation/settings-forms"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { SettingsCard } from "./settings-card"

const emptyBank: BankDetailsValues = {
  bank_name: "",
  ifsc_code: "",
  account_no: "",
  holder_name: "",
}

type BankDetailsFormProps = {
  initialValues?: Partial<BankDetailsValues>
}

export function BankDetailsForm({ initialValues }: BankDetailsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<BankDetailsValues>({
    defaultValues: { ...emptyBank, ...initialValues },
    resolver: yupResolver(bankDetailsSchema),
    mode: "onTouched",
  })

  const { mutate, isPending } = useMutation({
    mutationFn: updateBankDetails,
    onSuccess: (_, variables) => {
      toast.success("Bank details updated")
      reset(variables)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not update bank details")
    },
  })

  return (
    <SettingsCard id="settings-bank" title="Bank details">
      <form
        onSubmit={handleSubmit((data) => mutate(data))}
        className="space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="bank-name">Bank name</Label>
            <Input
              id="bank-name"
              placeholder="State Bank of India"
              {...register("bank_name")}
              errorMessage={errors.bank_name?.message}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank-ifsc">IFSC code</Label>
            <Input
              id="bank-ifsc"
              placeholder="SBIN0001234"
              {...register("ifsc_code")}
              errorMessage={errors.ifsc_code?.message}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank-account">Account number</Label>
            <Input
              id="bank-account"
              placeholder="1234567890"
              autoComplete="off"
              {...register("account_no")}
              errorMessage={errors.account_no?.message}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank-holder">Account holder name</Label>
            <Input
              id="bank-holder"
              placeholder="John Doe"
              {...register("holder_name")}
              errorMessage={errors.holder_name?.message}
            />
          </div>
        </div>
        <Button type="submit" disabled={!isValid || isPending}>
          {isPending ? "Saving…" : "Update Bank Details"}
        </Button>
      </form>
    </SettingsCard>
  )
}
