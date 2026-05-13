"use client"

import * as React from "react"

import type { AccountSettingsSectionId } from "@/lib/settings-sections"

/** Align with `scroll-mt-*` on section cards (e.g. scroll-mt-24 ≈ 6rem). */
const SECTION_ACTIVATION_TOP_PX = 112

function getNearestScrollContainer(el: HTMLElement | null): HTMLElement | Window {
  if (!el) return window
  let node: HTMLElement | null = el
  while (node) {
    const { overflowY } = getComputedStyle(node)
    const canScrollY =
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 1
    if (canScrollY) return node
    node = node.parentElement
  }
  return window
}

function readScrollMetrics(scrollRoot: HTMLElement | Window) {
  if (scrollRoot instanceof Window) {
    const doc = document.documentElement
    return {
      scrollTop: doc.scrollTop,
      scrollHeight: doc.scrollHeight,
      clientHeight: scrollRoot.innerHeight,
    }
  }
  return {
    scrollTop: scrollRoot.scrollTop,
    scrollHeight: scrollRoot.scrollHeight,
    clientHeight: scrollRoot.clientHeight,
  }
}

/**
 * Scroll-spy for settings anchors: last section whose heading has crossed the
 * activation line, with a “near bottom” rule so the final sections highlight
 * when the browser cannot scroll them flush under the sticky header.
 */
export function useActiveSettingsSection(
  sectionIds: AccountSettingsSectionId[]
) {
  const [activeId, setActiveId] = React.useState<AccountSettingsSectionId>(
    sectionIds[0]
  )

  const selectSection = React.useCallback(
    (id: AccountSettingsSectionId) => {
      setActiveId(id)
    },
    []
  )

  React.useEffect(() => {
    const first = document.getElementById(sectionIds[0])
    const scrollRoot = getNearestScrollContainer(first)

    const pickActive = () => {
      const elements = sectionIds
        .map((id) => {
          const el = document.getElementById(id)
          return el ? { id, el } : null
        })
        .filter((x): x is { id: AccountSettingsSectionId; el: HTMLElement } =>
          Boolean(x)
        )

      if (elements.length === 0) return

      const { scrollTop, scrollHeight, clientHeight } =
        readScrollMetrics(scrollRoot)
      const canScroll = scrollHeight > clientHeight + 1
      const roomBelow = scrollHeight - scrollTop - clientHeight
      const nearDocumentBottom = canScroll && roomBelow < 72

      if (nearDocumentBottom) {
        setActiveId(elements[elements.length - 1].id)
        return
      }

      let current = elements[0].id
      for (const { id, el } of elements) {
        const top = el.getBoundingClientRect().top
        if (top <= SECTION_ACTIVATION_TOP_PX) {
          current = id
        }
      }
      setActiveId(current)
    }

    pickActive()

    const target: HTMLElement | Window =
      scrollRoot === window ? window : scrollRoot
    target.addEventListener("scroll", pickActive, { passive: true })
    window.addEventListener("resize", pickActive)

    return () => {
      target.removeEventListener("scroll", pickActive)
      window.removeEventListener("resize", pickActive)
    }
  }, [sectionIds])

  return { activeId, selectSection }
}
