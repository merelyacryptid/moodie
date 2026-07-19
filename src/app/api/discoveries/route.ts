import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const entries = await prisma.entry.findMany({
    include: { activities: { include: { activity: true } } },
    orderBy: { date: "asc" },
  })

  if (entries.length === 0) {
    return NextResponse.json({ empty: true })
  }

  const moods = entries.map((e) => e.mood)
  const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length
  const avgEnergy = entries.reduce((a, e) => a + e.energy, 0) / entries.length
  const avgSleep = entries.reduce((a, e) => a + e.sleepHours, 0) / entries.length

  const activityCounts: Record<string, { count: number; totalMood: number }> = {}
  for (const entry of entries) {
    for (const ea of entry.activities) {
      if (!activityCounts[ea.activity.name]) {
        activityCounts[ea.activity.name] = { count: 0, totalMood: 0 }
      }
      activityCounts[ea.activity.name].count++
      activityCounts[ea.activity.name].totalMood += entry.mood
    }
  }

  let mostCommonActivity = ""
  let maxCount = 0
  let bestActivity = ""
  let bestAvgMood = 0

  for (const [name, data] of Object.entries(activityCounts)) {
    if (data.count > maxCount) {
      maxCount = data.count
      mostCommonActivity = name
    }
    const avg = data.totalMood / data.count
    if (avg > bestAvgMood) {
      bestAvgMood = avg
      bestActivity = name
    }
  }

  // Streaks (deduplicate by date)
  const uniqueDates = [...new Set(entries.map((e) => e.date))].sort()
  let currentStreak = 0
  let longestStreak = 0
  let streakCount = 0
  let prevDate: Date | null = null

  for (const dateStr of uniqueDates) {
    const d = new Date(dateStr)
    if (prevDate) {
      const diff = (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      if (diff === 1) {
        streakCount++
      } else {
        longestStreak = Math.max(longestStreak, streakCount)
        streakCount = 1
      }
    } else {
      streakCount = 1
    }
    prevDate = d
  }
  longestStreak = Math.max(longestStreak, streakCount)

  // Check if today is logged
  const today = new Date().toISOString().split("T")[0]
  const lastDateStr = uniqueDates[uniqueDates.length - 1]
  if (lastDateStr === today) {
    currentStreak = streakCount
  } else if (lastDateStr) {
    const lastDate = new Date(lastDateStr)
    const diff = (new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    currentStreak = diff <= 1 ? streakCount : 0
  }

  // Weekday analysis
  const weekdayMoods: Record<number, number[]> = {}
  for (const entry of entries) {
    const day = new Date(entry.date).getDay()
    if (!weekdayMoods[day]) weekdayMoods[day] = []
    weekdayMoods[day].push(entry.mood)
  }
  let happiestWeekday = ""
  let highestAvg = 0
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  for (const [day, ms] of Object.entries(weekdayMoods)) {
    const avg = ms.reduce((a, b) => a + b, 0) / ms.length
    if (avg > highestAvg) {
      highestAvg = avg
      happiestWeekday = dayNames[parseInt(day)]
    }
  }

  // Sleep analysis
  const goodSleepEntries = entries.filter((e) => e.sleepHours >= 7)
  const poorSleepEntries = entries.filter((e) => e.sleepHours <= 6)
  const avgMoodGoodSleep = goodSleepEntries.length
    ? goodSleepEntries.reduce((a, e) => a + e.mood, 0) / goodSleepEntries.length
    : null
  const avgMoodPoorSleep = poorSleepEntries.length
    ? poorSleepEntries.reduce((a, e) => a + e.mood, 0) / poorSleepEntries.length
    : null

  // Water intake
  const waterCounts: Record<string, number> = {}
  for (const entry of entries) {
    waterCounts[entry.waterLevel] = (waterCounts[entry.waterLevel] || 0) + 1
  }
  let mostCommonWater = ""
  let maxWater = 0
  for (const [level, count] of Object.entries(waterCounts)) {
    if (count > maxWater) {
      maxWater = count
      mostCommonWater = level
    }
  }

  return NextResponse.json({
    totalEntries: entries.length,
    avgMood: Math.round(avgMood * 10) / 10,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    avgSleep: Math.round(avgSleep * 10) / 10,
    longestStreak,
    currentStreak,
    mostCommonActivity,
    happiestWeekday,
    mostCommonWater,
    bestActivity: bestActivity || null,
    bestAvgMood: bestAvgMood ? Math.round(bestAvgMood * 10) / 10 : null,
    avgMoodGoodSleep: avgMoodGoodSleep ? Math.round(avgMoodGoodSleep * 10) / 10 : null,
    avgMoodPoorSleep: avgMoodPoorSleep ? Math.round(avgMoodPoorSleep * 10) / 10 : null,
  })
}
