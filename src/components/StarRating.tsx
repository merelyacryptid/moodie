"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  showValue?: boolean
  label?: string
}

const sizeConfig = {
  sm: {
    container: "h-4 w-4",
    star: "h-4 w-4",
  },
  md: {
    container: "h-6 w-6",
    star: "h-6 w-6",
  },
  lg: {
    container: "h-8 w-8",
    star: "h-8 w-8",
  },
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  interactive = true,
  showValue = true,
  label = "Star rating",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue !== null ? hoverValue : value

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onChange) return

    // Numeric keys 1-5
    const num = parseInt(e.key, 10)
    if (!isNaN(num) && num >= 1 && num <= max) {
      e.preventDefault()
      e.stopPropagation()
      onChange(num)
      return
    }

    // 0, Backspace, or Delete to reset/clear
    if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      e.stopPropagation()
      onChange(0)
      return
    }

    // Arrow keys for step-wise fine adjustments (0.5 steps)
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault()
      e.stopPropagation()
      const next = Math.min(max, (value || 0) + 0.5)
      onChange(next)
      return
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault()
      e.stopPropagation()
      const next = Math.max(0, (value || 0) - 0.5)
      onChange(next)
      return
    }

    if (e.key === "Home") {
      e.preventDefault()
      e.stopPropagation()
      onChange(0)
      return
    }

    if (e.key === "End") {
      e.preventDefault()
      e.stopPropagation()
      onChange(max)
      return
    }
  }

  return (
    <div
      tabIndex={interactive ? 0 : -1}
      role={interactive ? "slider" : undefined}
      aria-label={label}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? max : undefined}
      aria-valuenow={interactive ? displayValue : undefined}
      aria-valuetext={interactive ? `${displayValue} of ${max} stars` : undefined}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center gap-1.5 select-none transition-all rounded-xl",
        interactive &&
          "p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 hover:bg-amber-50/40"
      )}
      onMouseLeave={() => setHoverValue(null)}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, idx) => {
          const starNumber = idx + 1
          let fillPercentage = 0

          if (displayValue >= starNumber) {
            fillPercentage = 100
          } else if (displayValue >= starNumber - 0.5) {
            fillPercentage = 50
          }

          return (
            <div
              key={starNumber}
              className={cn(
                "relative inline-flex items-center justify-center shrink-0",
                sizeConfig[size].container,
                interactive && "transition-transform duration-150 hover:scale-110"
              )}
            >
              {/* Unfilled base star */}
              <Star
                className={cn(
                  sizeConfig[size].star,
                  "text-stone-200 fill-stone-100 transition-colors"
                )}
                strokeWidth={1.5}
              />

              {/* Filled star overlay with width clipping for half / full */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none transition-[width] duration-150"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    className={cn(
                      sizeConfig[size].star,
                      "max-w-none shrink-0 text-amber-400 fill-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.35)]"
                    )}
                    strokeWidth={1.5}
                  />
                </div>
              )}

              {/* Interactive Left Half Hitbox (0.5 rating) */}
              {interactive && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-1/2 cursor-pointer z-10 opacity-0 focus:outline-none"
                  onMouseEnter={() => setHoverValue(starNumber - 0.5)}
                  onClick={() => {
                    const nextVal = value === starNumber - 0.5 ? 0 : starNumber - 0.5
                    onChange?.(nextVal)
                  }}
                />
              )}

              {/* Interactive Right Half Hitbox (full star rating) */}
              {interactive && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute right-0 top-0 bottom-0 w-1/2 cursor-pointer z-10 opacity-0 focus:outline-none"
                  onMouseEnter={() => setHoverValue(starNumber)}
                  onClick={() => {
                    const nextVal = value === starNumber ? 0 : starNumber
                    onChange?.(nextVal)
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {interactive && showValue && displayValue > 0 && (
        <span className="ml-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/60 rounded-full px-2 py-0.5 transition-all">
          {displayValue} {displayValue === 1 ? "star" : "stars"}
        </span>
      )}
    </div>
  )
}

