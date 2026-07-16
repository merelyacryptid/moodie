"use client"

import { cn } from "@/lib/utils"
import { moodToEmoji, moodToColor } from "@/types"

interface CalendarDayProps {
  day: number
  mood?: number
  hasEntry: boolean
  onClick: () => void
}

export function CalendarDay({ day, mood, hasEntry, onClick }: CalendarDayProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl p-1.5 transition-all duration-150 min-h-[48px]",
        hasEntry && mood ? moodToColor(mood) : "bg-white/50",
        hasEntry && "hover:scale-105 cursor-pointer",
        !hasEntry && "opacity-40 cursor-default"
      )}
    >
      {hasEntry && mood && (
        <span className="text-sm">{moodToEmoji(mood)}</span>
      )}
      <span className={cn(
        "text-xs font-medium",
        hasEntry ? "text-stone-700" : "text-stone-300"
      )}>
        {day}
      </span>
    </button>
  )
}
