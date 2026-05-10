"use client"

import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { yupResolver } from "@hookform/resolvers/yup"
import { AxiosError } from "axios"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { SubmitHandler, useFieldArray, useForm, useWatch } from "react-hook-form"
import * as yup from "yup"

import {
  completeBrandProfile,
  mapBrandFormToApiPayload,
} from "@/lib/api/brand-profile"
import {
  BRAND_PRODUCT_CATEGORY_OPTIONS,
  BRAND_TARGET_MARKET_OPTIONS,
} from "@/lib/constants/brand-profile-options"
import type { BrandFormValues } from "@/lib/types/brand-profile"
import { mergeUserInfoCookie } from "@/lib/update-cookie"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const commerceLinkRowSchema = yup.object({
  url: yup.string().trim().url("Enter a valid URL").required("URL is required"),
})

const brandSchema: yup.ObjectSchema<BrandFormValues> = yup.object({
  brand_name: yup.string().trim().required("Brand name is required"),
  description: yup.string().trim().optional(),
  industry: yup.string().trim().optional(),
  headquarters_location: yup.string().trim().optional(),
  product_categories: yup
    .array()
    .of(yup.string().trim().required())
    .min(1, "Select at least one category")
    .required(),
  target_market_geo: yup
    .array()
    .of(yup.string().trim().required())
    .min(1, "Select at least one target market")
    .required(),
  commerce_links: yup
    .array()
    .of(commerceLinkRowSchema)
    .min(1, "Add at least one commerce link")
    .required(),
})

const defaultValues: BrandFormValues = {
  brand_name: "",
  description: "",
  industry: "",
  headquarters_location: "",
  product_categories: [],
  target_market_geo: [],
  commerce_links: [{ url: "" }],
}

const steps = [
  "Company details",
  "Product categories",
  "Target markets",
  "Commerce links",
] as const

const BrandProfileForm = () => {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const { mutateAsync: submitBrandProfile, isPending: isSubmittingProfile } =
    useMutation({
      mutationKey: ["users", "complete-profile", "brand"],
      mutationFn: async (values: BrandFormValues) => {
        const payload = mapBrandFormToApiPayload(values)
        return completeBrandProfile(payload)
      },
      onSuccess: () => {
        mergeUserInfoCookie({ profile_completed: true })
        toast.success("Brand profile completed successfully")
        router.push("/")
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Could not complete brand profile"
        toast.error(message)
      },
    })

  const {
    register,
    control,
    getValues,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<BrandFormValues>({
    defaultValues,
    resolver: yupResolver(brandSchema),
    mode: "onTouched",
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "commerce_links",
  })

  const selectedMarkets = useWatch({ control, name: "target_market_geo" })
  const selectedCategories = useWatch({ control, name: "product_categories" })

  const stepFields = useMemo(
    () =>
      [
        [
          "brand_name",
          "description",
          "industry",
          "headquarters_location",
        ] as const,
        ["product_categories"] as const,
        ["target_market_geo"] as const,
        ["commerce_links"] as const,
      ] as const,
    [],
  )

  const toggleMultiValue = (
    key: "target_market_geo" | "product_categories",
    value: string,
  ) => {
    const current = getValues(key) || []
    const next = current.includes(value)
      ? current.filter((item: string) => item !== value)
      : [...current, value]
    setValue(key, next, { shouldValidate: true, shouldTouch: true })
  }

  const goNext = async () => {
    const isStepValid = await trigger(stepFields[currentStep])
    if (!isStepValid) return
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const goPrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const onSubmit: SubmitHandler<BrandFormValues> = async (data) => {
    await submitBrandProfile(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Complete brand onboarding</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand_name">Brand name</Label>
                  <Input
                    id="brand_name"
                    placeholder="Your brand"
                    {...register("brand_name")}
                    errorMessage={errors.brand_name?.message}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Describe your brand"
                    {...register("description")}
                    errorMessage={errors.description?.message}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry (optional)</Label>
                  <Input
                    id="industry"
                    placeholder="e.g. Consumer goods"
                    {...register("industry")}
                    errorMessage={errors.industry?.message}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="headquarters_location">
                    Headquarters location (optional)
                  </Label>
                  <Input
                    id="headquarters_location"
                    placeholder="City, country"
                    {...register("headquarters_location")}
                    errorMessage={errors.headquarters_location?.message}
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="grid gap-2">
                <Label>Product categories</Label>
                <div className="flex flex-wrap gap-2">
                  {BRAND_PRODUCT_CATEGORY_OPTIONS.map((category) => {
                    const selected = selectedCategories?.includes(category)
                    return (
                      <Button
                        key={category}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        onClick={() =>
                          toggleMultiValue("product_categories", category)
                        }
                      >
                        {category}
                      </Button>
                    )
                  })}
                </div>
                {errors.product_categories?.message && (
                  <p className="text-sm text-red-500">
                    {errors.product_categories.message}
                  </p>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid gap-2">
                <Label>Target markets</Label>
                <div className="flex flex-wrap gap-2">
                  {BRAND_TARGET_MARKET_OPTIONS.map((region) => {
                    const selected = selectedMarkets?.includes(region)
                    return (
                      <Button
                        key={region}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        onClick={() =>
                          toggleMultiValue("target_market_geo", region)
                        }
                      >
                        {region}
                      </Button>
                    )
                  })}
                </div>
                {errors.target_market_geo?.message && (
                  <p className="text-sm text-red-500">
                    {errors.target_market_geo.message}
                  </p>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add your D2C store, marketplace storefronts, or other commerce
                  URLs.
                </p>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-2">
                    <Label htmlFor={`commerce_links.${index}.url`}>
                      Link {index + 1}
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <Input
                        id={`commerce_links.${index}.url`}
                        placeholder="https://yourstore.com"
                        className="flex-1"
                        {...register(`commerce_links.${index}.url`)}
                        errorMessage={
                          errors.commerce_links?.[index]?.url?.message
                        }
                      />
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          className="shrink-0"
                          onClick={() => remove(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {typeof errors.commerce_links?.message === "string" && (
                  <p className="text-sm text-red-500">
                    {errors.commerce_links.message}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ url: "" })}
                >
                  Add another link
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goPrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmittingProfile}>
                {isSubmittingProfile ? "Submitting..." : "Complete onboarding"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default BrandProfileForm
