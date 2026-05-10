"use client"

import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form"
import toast from "react-hot-toast"

import {
  BRAND_PRODUCT_CATEGORY_OPTIONS,
  BRAND_TARGET_MARKET_OPTIONS,
} from "@/lib/constants/brand-profile-options"
import {
  brandProfileMeQueryKey,
  brandProfileUpdateMutationKey,
  buildBrandProfileUpdatePayload,
  updateBrandProfile,
  type UpdateBrandProfilePayload,
} from "@/lib/api/brand-profile"
import {
  brandProfileInformationSchema,
  type BrandProfileInformationFormValues,
} from "@/lib/validation/settings-forms"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { SettingsCard } from "./settings-card"
import { ToggleStringMultiSelect } from "./toggle-string-multi-select"

const defaultBrandProfileValues: BrandProfileInformationFormValues = {
  brand_name: undefined,
  description: undefined,
  industry: undefined,
  headquarters_location: undefined,
  product_categories: [],
  target_market_geo: [],
  commerce_links: [{ url: "" }],
}

type BrandProfileInformationFormProps = {
  initialValues?: Partial<BrandProfileInformationFormValues>
}

/** Variables for TanStack mutation: API payload + full form snapshot for reset on success. */
type UpdateBrandProfileMutationInput = {
  payload: UpdateBrandProfilePayload
  formValues: BrandProfileInformationFormValues
}

export function BrandProfileInformationForm({
  initialValues,
}: BrandProfileInformationFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<BrandProfileInformationFormValues>({
    defaultValues: { ...defaultBrandProfileValues, ...initialValues },
    resolver: yupResolver(
      brandProfileInformationSchema,
    ) as Resolver<BrandProfileInformationFormValues>,
    mode: "onTouched",
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "commerce_links",
  })

  const selectedCategories =
    useWatch({ control, name: "product_categories" }) ?? []
  const selectedMarkets = useWatch({ control, name: "target_market_geo" }) ?? []

  const toggleMulti = (
    key: "product_categories" | "target_market_geo",
    value: string,
  ) => {
    const current = getValues(key) || []
    const next = current.includes(value)
      ? current.filter((item: string) => item !== value)
      : [...current, value]
    setValue(key, next, { shouldValidate: true, shouldTouch: true })
  }

  const { mutate, isPending } = useMutation({
    mutationKey: brandProfileUpdateMutationKey,
    mutationFn: ({ payload }: UpdateBrandProfileMutationInput) =>
      updateBrandProfile(payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: brandProfileMeQueryKey })
      toast.success("Brand profile updated")
      reset(variables.formValues)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Could not update brand profile",
      )
    },
  })

  const onSubmit: SubmitHandler<BrandProfileInformationFormValues> = (data) => {
    mutate({
      payload: buildBrandProfileUpdatePayload(data),
      formValues: data,
    })
  }

  return (
    <SettingsCard id="settings-brand-profile" title="Profile information">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="brand-name">Brand name (optional)</Label>
          <Input
            id="brand-name"
            placeholder="Your brand"
            {...register("brand_name")}
            errorMessage={errors.brand_name?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand-description">Description (optional)</Label>
          <Textarea
            id="brand-description"
            rows={4}
            placeholder="Describe your brand"
            {...register("description")}
            errorMessage={errors.description?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand-industry">Industry (optional)</Label>
          <Input
            id="brand-industry"
            placeholder="e.g. Consumer goods"
            {...register("industry")}
            errorMessage={errors.industry?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand-headquarters">Headquarters location (optional)</Label>
          <Input
            id="brand-headquarters"
            placeholder="City, country"
            {...register("headquarters_location")}
            errorMessage={errors.headquarters_location?.message}
          />
        </div>

        <ToggleStringMultiSelect
          label="Product categories (optional)"
          options={BRAND_PRODUCT_CATEGORY_OPTIONS}
          selected={selectedCategories}
          onToggle={(v) => toggleMulti("product_categories", v)}
          errorMessage={errors.product_categories?.message}
        />

        <ToggleStringMultiSelect
          label="Target markets (optional)"
          options={BRAND_TARGET_MARKET_OPTIONS}
          selected={selectedMarkets}
          onToggle={(v) => toggleMulti("target_market_geo", v)}
          errorMessage={errors.target_market_geo?.message}
        />

        <div className="space-y-4">
          <Label>Commerce links (optional)</Label>
          <p className="text-sm text-muted-foreground">
            D2C store, marketplace storefronts, or other commerce URLs.
          </p>
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-2">
              <Label htmlFor={`brand-commerce-${index}`} className="sr-only">
                Commerce link {index + 1}
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <Input
                  id={`brand-commerce-${index}`}
                  placeholder="https://yourstore.com"
                  className="flex-1"
                  {...register(`commerce_links.${index}.url`)}
                  errorMessage={errors.commerce_links?.[index]?.url?.message}
                />
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="shrink-0"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ url: "" })}
          >
            Add another link
          </Button>
        </div>

        <Button type="submit" disabled={!isValid || isPending}>
          {isPending ? "Saving…" : "Update profile"}
        </Button>
      </form>
    </SettingsCard>
  )
}
