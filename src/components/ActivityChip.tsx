"use client"

import { cn } from "@/lib/utils"

interface ActivityChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

export function ActivityChip({ label, selected, onClick }: ActivityChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150 border",
        selected
          ? "bg-yellow-200 border-yellow-300 text-yellow-900"
          : "bg-white border-stone-200 text-stone-600 hover:border-yellow-300 hover:bg-yellow-50"
      )}
    >
      {label}
    </button>
  )
}
