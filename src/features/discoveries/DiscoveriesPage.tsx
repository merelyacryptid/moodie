"use client"

import { useState, useEffect } from "react"

interface DiscoveriesData {
  totalEntries: number
  avgMood: number
  avgEnergy: number
  avgSleep: number
  longestStreak: number
  currentStreak: number
  mostCommonActivity: string
  happiestWeekday: string
  mostCommonWater: string
  bestActivity: string | null
  bestAvgMood: number | null
  avgMoodGoodSleep: number | null
  avgMoodPoorSleep: number | null
  empty?: boolean
}

interface Card {
  icon: string
  title: string
  body: string
}

export function DiscoveriesPage() {
  const [data, setData] = useState<DiscoveriesData | null>(null)

  useEffect(() => {
    fetch("/api/discoveries")
      .then((res) => res.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-stone-400">Loading...</p>
      </div>
    )
  }

  if (data.empty) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-5xl mb-4">🌱</div>
        <h2 className="text-xl font-semibold text-stone-600 mb-2">Keep exploring</h2>
        <p className="text-stone-400 max-w-xs">
          More reflections help reveal new patterns.
        </p>
      </div>
    )
  }

  const cards: Card[] = [
    {
      icon: "⭐",
      title: "Average Mood",
      body: `So far, your average mood is ${data.avgMood} out of 5.`,
    },
    {
      icon: "⚡",
      title: "Average Energy",
      body: `You've been averaging ${data.avgEnergy} out of 5 for energy.`,
    },
    {
      icon: "😴",
      title: "Average Sleep",
      body: `On average, you're getting ${data.avgSleep} hours of sleep.`,
    },
  ]

  if (data.currentStreak > 0) {
    cards.push({
      icon: "🔥",
      title: "Current Streak",
      body: `You've been reflecting for ${data.currentStreak} days in a row!`,
    })
  }

  if (data.longestStreak > 0) {
    cards.push({
      icon: "🏆",
      title: "Longest Streak",
      body: `Your longest reflection streak is ${data.longestStreak} days.`,
    })
  }

  if (data.mostCommonActivity) {
    cards.push({
      icon: "🎯",
      title: "Most Common Activity",
      body: `${data.mostCommonActivity} appears most often in your days.`,
    })
  }

  if (data.happiestWeekday) {
    cards.push({
      icon: "📅",
      title: "Happiest Weekday",
      body: `${data.happiestWeekday}s tend to be your brightest days.`,
    })
  }

  if (data.bestActivity) {
    cards.push({
      icon: "💫",
      title: "Activity & Mood",
      body: `We've noticed that ${data.bestActivity} often appears on your higher-mood days.`,
    })
  }

  if (data.avgMoodGoodSleep !== null) {
    cards.push({
      icon: "🌙",
      title: "Sleep & Mood",
      body: `On days after 7+ hours of sleep, your average mood is ${data.avgMoodGoodSleep}.`,
    })
  }

  if (data.avgMoodPoorSleep !== null) {
    cards.push({
      icon: "🌤️",
      title: "Less Sleep",
      body: `With 6 or fewer hours of sleep, your average mood is ${data.avgMoodPoorSleep}.`,
    })
  }

  if (data.mostCommonWater) {
    cards.push({
      icon: "💧",
      title: "Water Intake",
      body: `You most often drink ${data.mostCommonWater} of water.`,
    })
  }

  cards.push({
    icon: "📝",
    title: "Reflections",
    body: `You've completed ${data.totalEntries} reflections so far.`,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-stone-700 text-center">Discoveries</h1>
      <p className="text-sm text-stone-400 text-center -mt-2">
        Little things we&apos;ve noticed so far...
      </p>

      <div className="space-y-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:border-yellow-200 transition-colors duration-150"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <h3 className="font-medium text-stone-700 text-sm">{card.title}</h3>
                <p className="text-sm text-stone-500 mt-1">{card.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
