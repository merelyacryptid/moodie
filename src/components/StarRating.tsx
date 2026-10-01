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
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div
      className="inline-flex items-center gap-1.5 select-none"
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
                  aria-label={`${starNumber - 0.5} stars`}
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
                  aria-label={`${starNumber} stars`}
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
