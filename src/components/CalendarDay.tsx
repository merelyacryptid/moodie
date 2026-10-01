"use client"

import { cn } from "@/lib/utils"
import { moodToEmoji, moodToColor } from "@/types"

export interface CalendarDayProps {
  day: number
  mood?: number
  hasEntry: boolean
  entryCount?: number
  isToday?: boolean
  onClick: () => void
}

export function CalendarDay({
  day,
  mood,
  hasEntry,
  entryCount = 0,
  isToday = false,
  onClick,
}: CalendarDayProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-150 aspect-square w-full p-1 sm:p-2 select-none",
        hasEntry && mood !== undefined
          ? cn(
              moodToColor(mood),
              "shadow-xs hover:scale-105 hover:shadow-md cursor-pointer"
            )
          : "bg-white/60 hover:bg-white/90 text-stone-300 hover:text-stone-500 cursor-pointer",
        isToday && "ring-2 ring-amber-400 ring-offset-1 sm:ring-offset-2 font-semibold"
      )}
      aria-label={`Day ${day}${hasEntry && mood ? `, mood rating ${mood} of 5` : ""}${isToday ? ", today" : ""}`}
    >
      {hasEntry && mood !== undefined ? (
        <span className="text-sm sm:text-lg md:text-xl transition-transform duration-150 group-hover:scale-110 leading-none">
          {moodToEmoji(mood)}
        </span>
      ) : null}
      <span
        className={cn(
          "text-xs sm:text-sm font-medium leading-none transition-colors",
          hasEntry ? "text-stone-700" : "text-stone-400 group-hover:text-stone-600",
          hasEntry && mood !== undefined && "mt-1"
        )}
      >
        {day}
      </span>
      {entryCount > 1 && (
        <span className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 flex gap-0.5 pointer-events-none">
          {Array.from({ length: Math.min(entryCount, 3) }).map((_, i) => (
            <span key={i} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-stone-500/50" />
          ))}
        </span>
      )}
    </button>
  )
}

