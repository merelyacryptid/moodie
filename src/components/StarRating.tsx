"use client"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
}

export function StarRating({ value, onChange, max = 5, size = "md", interactive = true }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={cn(
            sizeClasses[size],
            "transition-all duration-200",
            star <= value ? "opacity-100" : "opacity-30",
            interactive && [
              "cursor-pointer",
              "hover:scale-125",
              "hover:opacity-90",
            ],
            !interactive && "cursor-default"
          )}
        >
          ⭐
        </button>
      ))}
    </div>
  )
}
