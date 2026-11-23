"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

export type LightboxItem = {
  id: string
  url: string
  title: string
  /** Shown under the title (uploader, date…). */
  caption?: string
  isVideo?: boolean
}

type MediaLightboxProps = {
  items: LightboxItem[]
  /** Index of the open item; null = closed. */
  index: number | null
  onIndexChange: (index: number | null) => void
}

/**
 * Full-size viewer for a set of images and videos: the whole file fits the screen, the arrow
 * buttons and the ← → keys step through the set, Esc closes.
 */
export function MediaLightbox({ items, index, onIndexChange }: MediaLightboxProps) {
  const open = index !== null && index >= 0 && index < items.length
  const item = open ? items[index] : null
  const count = items.length

  const step = (delta: number) => {
    if (index === null || count < 2) return
    onIndexChange((index + delta + count) % count)
  }

  useEffect(() => {
    if (!open || count < 2) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1)
      if (event.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onIndexChange(null)}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-3 p-3 sm:max-w-[calc(100vw-4rem)] sm:p-4">
        {item ? (
          <>
            <div className="flex min-w-0 items-start gap-3 pr-10">
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-sm font-medium">
                  {item.title}
                </DialogTitle>
                <DialogDescription className="truncate text-xs">
                  {count > 1 ? `${(index ?? 0) + 1} of ${count}` : null}
                  {count > 1 && item.caption ? " · " : null}
                  {item.caption}
                </DialogDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <a href={item.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open original
                </a>
              </Button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-black/90">
              {item.isVideo ? (
                <video
                  key={item.id}
                  src={item.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={item.id}
                  src={item.url}
                  alt={item.title}
                  className="max-h-full max-w-full object-contain"
                />
              )}

              {count > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={() => step(-1)}
                    aria-label="Previous"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={() => step(1)}
                    aria-label="Next"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/** A small image that opens full size on click. */
export function ZoomableImage({
  src,
  title,
  className,
}: {
  src: string
  title: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-fit cursor-zoom-in rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View ${title} full size`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className={className} />
      </button>
      <MediaLightbox
        items={[{ id: src, url: src, title }]}
        index={open ? 0 : null}
        onIndexChange={(index) => setOpen(index !== null)}
      />
    </>
  )
}
