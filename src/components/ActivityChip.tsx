"use client"

import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ActivityChipProps {
  label: string
  selected: boolean
  onClick: () => void
  onRemove?: () => void
}

export function ActivityChip({ label, selected, onClick, onRemove }: ActivityChipProps) {
  return (
    <div className="relative inline-flex">
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
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-300 text-white flex items-center justify-center hover:bg-red-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
