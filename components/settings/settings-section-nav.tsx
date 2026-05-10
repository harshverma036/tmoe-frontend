"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type {
  AccountSettingsSection,
  AccountSettingsSectionId,
} from "@/lib/settings-sections"

type SettingsSectionNavProps = {
  sections: AccountSettingsSection[]
  activeId: AccountSettingsSectionId
  onSelectSection: (id: AccountSettingsSectionId) => void
}

export function SettingsSectionNav({
  sections,
  activeId,
  onSelectSection,
}: SettingsSectionNavProps) {
  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: AccountSettingsSectionId
  ) => {
    e.preventDefault()
    onSelectSection(id)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav
      aria-label="Settings sections"
      className="lg:sticky lg:top-20 lg:self-start"
    >
      <ul className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {sections.map((section) => {
          const isActive = section.id === activeId
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
                className={cn(
                  "relative block whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  "lg:border-l-2 lg:border-transparent lg:py-1.5 lg:pl-3 lg:pr-0",
                  isActive &&
                    "font-medium text-foreground lg:border-l-foreground"
                )}
              >
                {section.navLabel}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
