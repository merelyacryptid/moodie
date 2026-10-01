"use client"

import { useState } from "react"
import type { ActivityStat } from "@/lib/discoveries"

interface ActivityChartsProps {
  activityStats: ActivityStat[]
  globalAvgMood: number
  totalReflections: number
}

const PASTEL_BAR_COLORS = [
  "bg-amber-300",
  "bg-emerald-300",
  "bg-sky-300",
  "bg-indigo-300",
  "bg-rose-300",
  "bg-orange-300",
  "bg-teal-300",
]

export function ActivityCharts({
  activityStats,
  globalAvgMood,
  totalReflections,
}: ActivityChartsProps) {
  const [viewMode, setViewMode] = useState<"frequency" | "moodLift">("frequency")

  if (activityStats.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-100 text-center py-8 space-y-2">
        <span className="text-3xl">🌱</span>
        <h4 className="font-semibold text-stone-700 text-sm">Activities in Your Days</h4>
        <p className="text-xs text-stone-400 max-w-xs mx-auto">
          Tag activities in today&apos;s reflection to watch visual habits and mood associations appear here.
        </p>
      </div>
    )
  }

  // Top activities by count (limit to 6)
  const topByFrequency = activityStats.slice(0, 6)
  const maxCount = Math.max(...topByFrequency.map((a) => a.count), 1)

  // Activities sorted by mood lift (best mood boosters)
  const sortedByMood = [...activityStats]
    .filter((a) => a.count >= (totalReflections >= 4 ? 2 : 1))
    .sort((a, b) => b.avgMood - a.avgMood)
    .slice(0, 6)

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-100 space-y-4">
      {/* Header with Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">📊</span>
          <div>
            <h3 className="font-semibold text-stone-800 text-sm">Activities & Impact</h3>
            <p className="text-[11px] text-stone-400">Visual patterns across your daily habits</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-stone-100 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewMode("frequency")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === "frequency"
                ? "bg-white text-stone-800 shadow-2xs"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            Frequency
          </button>
          <button
            type="button"
            onClick={() => setViewMode("moodLift")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === "moodLift"
                ? "bg-white text-stone-800 shadow-2xs"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            Mood Lift
          </button>
        </div>
      </div>

      {/* Chart 1: Activity Frequency Bars */}
      {viewMode === "frequency" && (
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium px-1">
            <span>Habit</span>
            <span>Reflections & Share</span>
          </div>

          <div className="space-y-2.5">
            {topByFrequency.map((activity, idx) => {
              const barWidthPercent = Math.max(12, Math.round((activity.count / maxCount) * 100))
              const colorClass = PASTEL_BAR_COLORS[idx % PASTEL_BAR_COLORS.length]

              return (
                <div key={activity.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-700 flex items-center gap-1.5">
                      <span>{activity.icon}</span>
                      <span>{activity.name}</span>
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {activity.count} {activity.count === 1 ? "time" : "times"} ({activity.percentage}%)
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Chart 2: Mood Association / Boost Bars */}
      {viewMode === "moodLift" && (
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium px-1">
            <span>Activity</span>
            <span>Avg Mood & Difference (Baseline {globalAvgMood}★)</span>
          </div>

          <div className="space-y-2.5">
            {sortedByMood.map((activity, idx) => {
              // Mood is 1 to 5, mapped to 0% to 100%
              const moodPercent = Math.round(((activity.avgMood - 1) / 4) * 100)
              const isPositiveLift = activity.moodLift > 0
              const liftLabel =
                activity.moodLift > 0
                  ? `+${activity.moodLift}★`
                  : activity.moodLift < 0
                  ? `${activity.moodLift}★`
                  : "0★"

              return (
                <div key={activity.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-700 flex items-center gap-1.5">
                      <span>{activity.icon}</span>
                      <span>{activity.name}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-700">{activity.avgMood}★</span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          isPositiveLift
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : activity.moodLift < 0
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50"
                            : "bg-stone-50 text-stone-500 border border-stone-200"
                        }`}
                      >
                        {liftLabel}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Mood Level Bar */}
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        activity.avgMood >= 4
                          ? "bg-amber-300"
                          : activity.avgMood >= 3
                          ? "bg-sky-300"
                          : "bg-indigo-300"
                      }`}
                      style={{ width: `${Math.max(10, moodPercent)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-[10px] text-stone-400 text-center pt-1 italic">
            &ldquo;Things that seem to help&rdquo; — habits associated with higher mood reflections
          </p>
        </div>
      )}
    </div>
  )
}
