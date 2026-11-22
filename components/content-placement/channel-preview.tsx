"use client"

import { BellRing, Search, Smartphone, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ContentPlacementPosition } from "@/lib/content-placement.types"

type Channel = Extract<ContentPlacementPosition, "GOOGLE" | "AEO" | "PUSH_NOTIFICATION" | "IN_APP">

type ChannelPreviewProps = {
  channel: ContentPlacementPosition
  size?: "sm" | "lg"
  emphasized?: boolean
  className?: string
}

/** Placeholder text line. */
function Line({ className }: { className?: string }) {
  return <div className={cn("bg-muted h-1.5 rounded-full", className)} />
}

/** The highlighted item: where the branded content shows up in the channel. */
function Highlight({
  emphasized,
  children,
  className,
}: {
  emphasized?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-primary relative rounded-lg border p-3",
        emphasized
          ? "bg-primary/20 ring-2 ring-primary/35"
          : "bg-primary/10",
        className,
      )}
    >
      {emphasized ? (
        <span className="bg-primary text-primary-foreground absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm">
          Your content
        </span>
      ) : null}
      {children}
    </div>
  )
}

function Muted({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border-muted-foreground/20 bg-muted/30 rounded-lg border border-dashed p-3", className)}>
      {children}
    </div>
  )
}

function GooglePreview({ emphasized }: { emphasized?: boolean }) {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <div className="border-border flex items-center gap-2 rounded-full border px-3 py-2">
        <Search className="text-muted-foreground size-3.5" />
        <span className="text-muted-foreground text-xs">best hotels in Goa for a weekend</span>
      </div>
      <Highlight emphasized={emphasized}>
        <p className="text-muted-foreground text-[10px]">publisher-site.com › travel</p>
        <p className="text-primary mt-1 text-sm font-semibold">
          Stunning Goa beaches you must visit for an unforgettable holiday
        </p>
        <div className="mt-2 space-y-1.5">
          <Line className="w-full" />
          <Line className="w-4/5" />
        </div>
      </Highlight>
      {[1, 2].map((n) => (
        <Muted key={n}>
          <Line className="w-1/3" />
          <Line className="mt-2 w-2/3" />
          <Line className="mt-2 w-full" />
        </Muted>
      ))}
    </div>
  )
}

function AeoPreview({ emphasized }: { emphasized?: boolean }) {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <div className="bg-muted/60 ml-auto max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-xs">
        Where should I stay for a weekend in Goa?
      </div>
      <div className="flex gap-2">
        <span className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
          <Sparkles className="size-3.5" />
        </span>
        <div className="flex-1 space-y-1.5 pt-1">
          <Line className="w-full" />
          <Line className="w-11/12" />
          <Line className="w-3/4" />
        </div>
      </div>
      <p className="text-muted-foreground pl-8 text-[10px] font-medium uppercase tracking-wide">Sources</p>
      <div className="grid gap-2 pl-8 sm:grid-cols-2">
        <Highlight emphasized={emphasized} className="p-2.5">
          <p className="text-[10px] text-muted-foreground">publisher-site.com</p>
          <p className="mt-0.5 text-xs font-semibold leading-snug">
            Stunning Goa beaches you must visit
          </p>
        </Highlight>
        <Muted className="p-2.5">
          <Line className="w-1/2" />
          <Line className="mt-2 w-full" />
        </Muted>
      </div>
    </div>
  )
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="border-border bg-muted/40 flex h-full max-h-[460px] min-h-[260px] w-[220px] flex-col overflow-hidden rounded-[28px] border-4 shadow-sm">
        <div className="flex justify-center py-2">
          <span className="bg-muted-foreground/30 h-1.5 w-14 rounded-full" />
        </div>
        {children}
      </div>
    </div>
  )
}

function PushPreview({ emphasized }: { emphasized?: boolean }) {
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col gap-2 px-3">
        <p className="text-muted-foreground py-3 text-center text-2xl font-light tabular-nums">9:41</p>
        <Highlight emphasized={emphasized} className="bg-background p-2.5">
          <div className="flex items-center gap-1.5">
            <BellRing className="text-primary size-3" />
            <span className="text-muted-foreground text-[10px]">Publisher app · now</span>
          </div>
          <p className="mt-1 text-xs font-semibold leading-snug">
            5 Goa beaches for your next holiday
          </p>
          <Line className="mt-1.5 w-4/5" />
        </Highlight>
        <Muted className="bg-background/60 p-2.5">
          <Line className="w-1/3" />
          <Line className="mt-2 w-full" />
        </Muted>
      </div>
    </PhoneFrame>
  )
}

function InAppPreview({ emphasized }: { emphasized?: boolean }) {
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-semibold">Publisher app</span>
          <Smartphone className="text-muted-foreground size-3.5" />
        </div>
        <Muted className="bg-background/60 h-14 p-2">
          <Line className="w-2/3" />
        </Muted>
        <Highlight emphasized={emphasized} className="bg-background p-2">
          <div className="bg-primary/25 mb-2 h-16 rounded-md" />
          <p className="text-xs font-semibold leading-snug">Stay like a local in Goa</p>
          <Line className="mt-1.5 w-3/4" />
        </Highlight>
        <Muted className="bg-background/60 h-14 p-2">
          <Line className="w-1/2" />
        </Muted>
      </div>
    </PhoneFrame>
  )
}

const TITLE: Record<Channel, string> = {
  GOOGLE: "Search results",
  AEO: "AI answer",
  PUSH_NOTIFICATION: "Lock screen",
  IN_APP: "Publisher app",
}

/**
 * Mock of an off-site channel (Google, AI answers, push, in app), highlighting where the
 * branded content shows up. Same footprint as the on-site page mock.
 */
export function ChannelPreview({
  channel,
  size = "sm",
  emphasized = false,
  className,
}: ChannelPreviewProps) {
  const isLg = size === "lg"
  const c = channel as Channel

  return (
    <div
      className={cn(
        "bg-background flex w-full flex-col overflow-hidden rounded-2xl border border-border/80 shadow-md",
        isLg ? "min-h-[min(72vh,560px)]" : "aspect-[4/3] max-w-md",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "bg-muted/70 flex shrink-0 items-center gap-1.5 border-b",
          isLg ? "h-9 px-3" : "h-7 px-2",
        )}
      >
        <span className="bg-muted-foreground/35 size-2 rounded-full" />
        <span className="bg-muted-foreground/35 size-2 rounded-full" />
        <span className="bg-muted-foreground/35 size-2 rounded-full" />
        <span
          className={cn(
            "text-muted-foreground ml-1 truncate font-medium",
            isLg ? "text-xs" : "text-[10px]",
          )}
        >
          {TITLE[c] ?? "Channel"}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {c === "GOOGLE" ? <GooglePreview emphasized={emphasized} /> : null}
        {c === "AEO" ? <AeoPreview emphasized={emphasized} /> : null}
        {c === "PUSH_NOTIFICATION" ? <PushPreview emphasized={emphasized} /> : null}
        {c === "IN_APP" ? <InAppPreview emphasized={emphasized} /> : null}
      </div>
    </div>
  )
}
