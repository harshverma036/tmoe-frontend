"use client"

import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useForm, type Resolver } from "react-hook-form"
import toast from "react-hot-toast"

import {
  buildRssSectionPayload,
  publisherProfileMeQueryKey,
  updatePublisherProfile,
  type UpdatePublisherProfilePayload,
} from "@/lib/api/publisher-profile"
import { rssFeedSchema, type RssFeedValues } from "@/lib/validation/settings-forms"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { SettingsCard } from "./settings-card"

const emptyRssFeed: RssFeedValues = {
  rss_feed_url: undefined,
}

type RssFeedFormProps = {
  initialValues?: Partial<RssFeedValues>
}

export function RssFeedForm({ initialValues }: RssFeedFormProps) {

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<RssFeedValues>({
    defaultValues: { ...emptyRssFeed, ...initialValues },
    resolver: yupResolver(rssFeedSchema) as Resolver<RssFeedValues>,
    mode: "onTouched",
  })

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      payload,
    }: {
      payload: UpdatePublisherProfilePayload
      formValues: RssFeedValues
    }) => updatePublisherProfile(payload),
    onSuccess: async (_, { formValues }) => {
      toast.success("RSS feed URL updated")
      reset(formValues)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not update RSS feed URL")
    },
  })

  return (
    <SettingsCard id="settings-rss" title="RSS feed">
      <form
        onSubmit={handleSubmit((data) => {
          const payload = buildRssSectionPayload(data)
          if (Object.keys(payload).length === 0) {
            toast.error("Enter a valid RSS feed URL")
            return
          }
          mutate({ payload, formValues: data })
        })}
        className="space-y-6"
      >
        <div className="grid gap-2 w-full">
          <Label htmlFor="rss-feed-url">RSS feed URL</Label>
          <Input
            id="rss-feed-url"
            type="url"
            placeholder="https://example.com/feed.xml"
            autoComplete="off"
            {...register("rss_feed_url")}
            errorMessage={errors.rss_feed_url?.message}
          />
        </div>
        <Button type="submit" disabled={!isValid || isPending}>
          {isPending ? "Saving…" : "Update RSS feed"}
        </Button>
      </form>
    </SettingsCard>
  )
}
