"use client"

import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { calculateDiscoveries, type EnhancedDiscoveriesData } from "@/lib/discoveries"
import { generateMockEntries } from "@/lib/mockData"
import { MockDataNotice } from "@/components/MockDataNotice"
import { MoodWaveChart } from "./MoodWaveChart"
import { ActivityCharts } from "./ActivityCharts"
import { Star, Flame, Trophy, Sparkles } from "lucide-react"
import { useUserName } from "@/hooks/useUserName"

export function DiscoveriesPage() {
  const { name: userName } = useUserName()
  const entries = useLiveQuery(() => db.entries.toArray(), [])

  // If local db is empty, show realistic mock data with an honest notice
  const isMock = Boolean(entries && entries.length === 0)
  const activeEntries = isMock ? generateMockEntries() : (entries || [])

  const data: EnhancedDiscoveriesData | null = useMemo(() => {
    if (entries === undefined) return null
    return calculateDiscoveries(activeEntries)
  }, [entries, activeEntries])

  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-stone-400">Loading discoveries...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Sample Preview Notice Banner if user hasn't logged real entries yet */}
      {isMock && <MockDataNotice />}

      {/* Page Title & Subtitle */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
          <h1 className="text-2xl font-semibold text-stone-800">
            {userName ? `${userName}'s Discoveries` : "Discoveries"}
          </h1>
        </div>
        <p className="text-xs text-stone-400">
          {userName
            ? `Little patterns and connections noticed from your reflections, ${userName}`
            : "Little patterns and connections noticed from your reflections"}
        </p>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-2xs border border-stone-100 flex flex-col items-center text-center">
          <span className="flex items-center gap-1 text-[11px] font-medium text-stone-400">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Avg Mood
          </span>
          <span className="text-lg font-bold text-stone-800 mt-0.5">
            {data.avgMood} <span className="text-xs font-normal text-stone-400">/ 5</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl p-3 shadow-2xs border border-stone-100 flex flex-col items-center text-center">
          <span className="flex items-center gap-1 text-[11px] font-medium text-stone-400">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            Current
          </span>
          <span className="text-lg font-bold text-stone-800 mt-0.5">
            {data.currentStreak} <span className="text-xs font-normal text-stone-400">days</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl p-3 shadow-2xs border border-stone-100 flex flex-col items-center text-center">
          <span className="flex items-center gap-1 text-[11px] font-medium text-stone-400">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Best Streak
          </span>
          <span className="text-lg font-bold text-stone-800 mt-0.5">
            {data.longestStreak} <span className="text-xs font-normal text-stone-400">days</span>
          </span>
        </div>
      </div>

      {/* 1. Dynamic Animated Line Graph (Mood Wave Over Time) */}
      <MoodWaveChart timeline={data.timeline} avgMood={data.avgMood} />

      {/* 2. Visual Activity Charts (Frequency & Mood Boost) */}
      <ActivityCharts
        activityStats={data.activityStats}
        globalAvgMood={data.avgMood}
        totalReflections={data.totalReflections}
      />

      {/* 3. Discovered Connections & Specific Correlations (2-Column Bento Grid) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
            <span>✨</span>
            <span>Discovered Connections</span>
          </h2>
          <span className="text-[11px] text-stone-400">Honest pattern insights</span>
        </div>

        {/* 2-Column Bento Grid of Correlation Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.correlations.map((card) => {
            const hasData = card.hasEnoughData

            return (
              <div
                key={card.id}
                className={`rounded-3xl p-4 transition-all duration-200 border flex flex-col justify-between ${
                  hasData
                    ? "bg-white border-amber-100 shadow-2xs hover:border-amber-200"
                    : "bg-stone-50/70 border-dashed border-stone-200 opacity-90"
                }`}
              >
                <div className="space-y-2">
                  {/* Card Header: Icon + Title + Status Badge */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{card.icon}</span>
                      <h3 className="font-semibold text-stone-800 text-xs">{card.title}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        hasData
                          ? "bg-amber-100/70 text-amber-900 border border-amber-200/50"
                          : "bg-stone-200/60 text-stone-500"
                      }`}
                    >
                      {hasData ? "Pattern found" : "Exploring"}
                    </span>
                  </div>

                  {/* Body Text */}
                  <p className="text-xs text-stone-600 leading-relaxed font-normal">
                    {card.insight}
                  </p>
                </div>

                {/* Footer: Details or Honest Progress Meter */}
                <div className="pt-3 mt-1 border-t border-stone-100">
                  {hasData && card.details && (
                    <p className="text-[10px] text-stone-400">{card.details}</p>
                  )}

                  {!hasData && card.progress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>{card.progress.label}</span>
                        <span className="font-medium font-mono text-stone-500">
                          {card.progress.current} / {card.progress.required}
                        </span>
                      </div>
                      <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((card.progress.current / card.progress.required) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
