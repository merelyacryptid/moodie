import type { Entry } from "@/types"

export const ACTIVITY_ICONS: Record<string, string> = {
  Reading: "📖",
  "Competitive Programming": "💻",
  Development: "⚡",
  Study: "📚",
  Exercise: "🏃",
  Walking: "🚶",
  Running: "🏃",
  Gym: "🏋️",
  Yoga: "🧘",
  Movie: "🎬",
  TV: "📺",
  Gaming: "🎮",
  Music: "🎵",
  Drawing: "✏️",
  Art: "🎨",
  Cooking: "🍳",
  Friends: "👥",
  Family: "🏡",
  Nature: "🌿",
  Cafe: "☕",
  Shopping: "🛍️",
  Cleaning: "🧹",
  Travel: "✈️",
  Coding: "💻",
}

export interface TimelinePoint {
  id: string
  date: string
  timeOfDay: string
  mood: number
  energy: number
  sleepHours: number
  waterLevel: string
  activities: string[]
  note: string | null
  loggedAt: number
}

export interface ActivityStat {
  name: string
  icon: string
  count: number
  percentage: number
  avgMood: number
  moodLift: number // relative to global average mood
  avgEnergy: number
}

export interface CorrelationCard {
  id: string
  icon: string
  title: string
  hasEnoughData: boolean
  insight: string
  details?: string
  progress?: {
    current: number
    required: number
    label: string
  }
}

export interface EnhancedDiscoveriesData {
  empty: boolean
  totalReflections: number
  avgMood: number
  avgEnergy: number
  avgSleep: number
  currentStreak: number
  longestStreak: number
  timeline: TimelinePoint[]
  activityStats: ActivityStat[]
  correlations: CorrelationCard[]
  // Legacy compatibility fields:
  totalEntries: number
  mostCommonActivity: string
  happiestWeekday: string
  mostCommonWater: string
  bestActivity: string | null
  bestAvgMood: number | null
  avgMoodGoodSleep: number | null
  avgMoodPoorSleep: number | null
}

const TIME_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 }

export function calculateDiscoveries(entries: Entry[]): EnhancedDiscoveriesData {
  if (!entries || entries.length === 0) {
    return {
      empty: true,
      totalReflections: 0,
      totalEntries: 0,
      avgMood: 0,
      avgEnergy: 0,
      avgSleep: 0,
      currentStreak: 0,
      longestStreak: 0,
      timeline: [],
      activityStats: [],
      correlations: [],
      mostCommonActivity: "",
      happiestWeekday: "",
      mostCommonWater: "",
      bestActivity: null,
      bestAvgMood: null,
      avgMoodGoodSleep: null,
      avgMoodPoorSleep: null,
    }
  }

  // Filter entries with valid positive mood
  const validEntries = entries.filter((e) => typeof e.mood === "number" && e.mood > 0)
  if (validEntries.length === 0) {
    return {
      empty: true,
      totalReflections: entries.length,
      totalEntries: entries.length,
      avgMood: 0,
      avgEnergy: 0,
      avgSleep: 0,
      currentStreak: 0,
      longestStreak: 0,
      timeline: [],
      activityStats: [],
      correlations: [],
      mostCommonActivity: "",
      happiestWeekday: "",
      mostCommonWater: "",
      bestActivity: null,
      bestAvgMood: null,
      avgMoodGoodSleep: null,
      avgMoodPoorSleep: null,
    }
  }

  // Sort timeline chronologically (Date ASC, TimeOfDay ASC)
  const sortedEntries = [...validEntries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (TIME_ORDER[a.timeOfDay] ?? 0) - (TIME_ORDER[b.timeOfDay] ?? 0)
  })

  const timeline: TimelinePoint[] = sortedEntries.map((e) => ({
    id: e.id,
    date: e.date,
    timeOfDay: e.timeOfDay,
    mood: e.mood,
    energy: e.energy || 0,
    sleepHours: e.sleepHours || 0,
    waterLevel: e.waterLevel || "",
    activities: Array.isArray(e.activities) ? e.activities : [],
    note: e.note || null,
    loggedAt: e.loggedAt || Date.now(),
  }))

  // Averages
  const totalReflections = validEntries.length
  const avgMood = Math.round((validEntries.reduce((s, e) => s + e.mood, 0) / totalReflections) * 10) / 10
  const avgEnergy = Math.round((validEntries.reduce((s, e) => s + (e.energy || 0), 0) / totalReflections) * 10) / 10
  
  const entriesWithSleep = validEntries.filter((e) => (e.sleepHours || 0) > 0)
  const avgSleep = entriesWithSleep.length > 0
    ? Math.round((entriesWithSleep.reduce((s, e) => s + e.sleepHours, 0) / entriesWithSleep.length) * 10) / 10
    : 0

  // Streaks calculation
  const uniqueDates = [...new Set(validEntries.map((e) => e.date))].sort()
  let currentStreak = 0
  let longestStreak = 0
  let streakCount = 0
  let prevDate: Date | null = null

  for (const dateStr of uniqueDates) {
    const d = new Date(dateStr)
    if (prevDate) {
      const diff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
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

  const today = new Date().toISOString().split("T")[0]
  const lastDateStr = uniqueDates[uniqueDates.length - 1]
  if (lastDateStr === today) {
    currentStreak = streakCount
  } else if (lastDateStr) {
    const lastDate = new Date(lastDateStr)
    const diff = Math.round((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    currentStreak = diff <= 1 ? streakCount : 0
  }

  // Activity breakdown & statistics
  const activityMap: Record<string, { count: number; totalMood: number; totalEnergy: number }> = {}
  for (const entry of validEntries) {
    for (const act of (entry.activities || [])) {
      const name = typeof act === "string" ? act : (act as any).activity?.name
      if (!name) continue
      if (!activityMap[name]) {
        activityMap[name] = { count: 0, totalMood: 0, totalEnergy: 0 }
      }
      activityMap[name].count++
      activityMap[name].totalMood += entry.mood
      activityMap[name].totalEnergy += (entry.energy || 0)
    }
  }

  const activityStats: ActivityStat[] = Object.entries(activityMap)
    .map(([name, data]) => {
      const itemAvgMood = Math.round((data.totalMood / data.count) * 10) / 10
      const moodLift = Math.round((itemAvgMood - avgMood) * 10) / 10
      return {
        name,
        icon: ACTIVITY_ICONS[name] || "⭐",
        count: data.count,
        percentage: Math.round((data.count / totalReflections) * 100),
        avgMood: itemAvgMood,
        moodLift,
        avgEnergy: Math.round((data.totalEnergy / data.count) * 10) / 10,
      }
    })
    .sort((a, b) => b.count - a.count)

  const mostCommonActivity = activityStats[0]?.name || ""

  // Best activity with at least 2 entries (or 1 if total is small)
  const qualifiedForBest = activityStats.filter((a) => a.count >= (totalReflections >= 4 ? 2 : 1))
  const bestActivityItem = [...qualifiedForBest].sort((a, b) => b.avgMood - a.avgMood)[0]
  const bestActivity = bestActivityItem?.name || null
  const bestAvgMood = bestActivityItem?.avgMood || null

  // Weekdays
  const weekdayMoods: Record<number, number[]> = {}
  for (const entry of validEntries) {
    const day = new Date(entry.date).getDay()
    if (!weekdayMoods[day]) weekdayMoods[day] = []
    weekdayMoods[day].push(entry.mood)
  }
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  let happiestWeekday = ""
  let highestWeekdayAvg = 0
  for (const [day, ms] of Object.entries(weekdayMoods)) {
    const avg = ms.reduce((a, b) => a + b, 0) / ms.length
    if (avg > highestWeekdayAvg) {
      highestWeekdayAvg = Math.round(avg * 10) / 10
      happiestWeekday = dayNames[parseInt(day)]
    }
  }

  // Water counts
  const waterCounts: Record<string, number> = {}
  for (const entry of validEntries) {
    if (entry.waterLevel) {
      waterCounts[entry.waterLevel] = (waterCounts[entry.waterLevel] || 0) + 1
    }
  }
  let mostCommonWater = ""
  let maxWater = 0
  for (const [level, count] of Object.entries(waterCounts)) {
    if (count > maxWater) {
      maxWater = count
      mostCommonWater = level
    }
  }

  // Sleep breakdown
  const goodSleepEntries = validEntries.filter((e) => (e.sleepHours || 0) >= 7)
  const poorSleepEntries = validEntries.filter((e) => (e.sleepHours || 0) > 0 && (e.sleepHours || 0) <= 6)
  const avgMoodGoodSleep = goodSleepEntries.length
    ? Math.round((goodSleepEntries.reduce((a, e) => a + e.mood, 0) / goodSleepEntries.length) * 10) / 10
    : null
  const avgMoodPoorSleep = poorSleepEntries.length
    ? Math.round((poorSleepEntries.reduce((a, e) => a + e.mood, 0) / poorSleepEntries.length) * 10) / 10
    : null

  // -------------------------------------------------------------
  // CORRELATION INSIGHTS GENERATION (WITH HONEST DATA CHECKS)
  // -------------------------------------------------------------
  const correlations: CorrelationCard[] = []

  // 1. Sleep & Mood Correlation
  const hasSleepCorrelationData =
    entriesWithSleep.length >= 3 &&
    goodSleepEntries.length >= 1 &&
    poorSleepEntries.length >= 1

  if (hasSleepCorrelationData && avgMoodGoodSleep !== null && avgMoodPoorSleep !== null) {
    const diff = Math.round((avgMoodGoodSleep - avgMoodPoorSleep) * 10) / 10
    let insight = ""
    if (diff >= 0.3) {
      insight = `You seem to feel noticeably brighter on days after 7+ hours of sleep (averaging ${avgMoodGoodSleep} ⭐ vs ${avgMoodPoorSleep} ⭐ with less sleep).`
    } else if (diff <= -0.3) {
      insight = `Interestingly, your ratings were slightly higher on days with 6 or fewer hours of sleep (${avgMoodPoorSleep} ⭐ vs ${avgMoodGoodSleep} ⭐).`
    } else {
      insight = `Your mood appears consistent whether you get 7+ hours (${avgMoodGoodSleep} ⭐) or less sleep (${avgMoodPoorSleep} ⭐).`
    }

    correlations.push({
      id: "sleep_mood",
      icon: "🌙",
      title: "Sleep & Mood",
      hasEnoughData: true,
      insight,
      details: `${goodSleepEntries.length} reflections with 7+ hrs, ${poorSleepEntries.length} with ≤6 hrs`,
    })
  } else {
    correlations.push({
      id: "sleep_mood",
      icon: "🌙",
      title: "Sleep & Mood",
      hasEnoughData: false,
      insight: "Log a few more reflections with both 7+ hours and shorter sleep to see how sleep duration relates to your mood.",
      progress: {
        current: entriesWithSleep.length,
        required: 3,
        label: "reflections with sleep hours",
      },
    })
  }

  // 2. Movement & Energy Correlation
  const movementActivities = new Set(["Exercise", "Walking", "Running", "Gym", "Yoga"])
  const activeDays = validEntries.filter((e) =>
    (e.activities || []).some((act) => movementActivities.has(typeof act === "string" ? act : (act as any).activity?.name))
  )
  const restDays = validEntries.filter((e) =>
    !(e.activities || []).some((act) => movementActivities.has(typeof act === "string" ? act : (act as any).activity?.name))
  )

  const hasMovementData = activeDays.length >= 2 && restDays.length >= 2
  if (hasMovementData) {
    const activeEnergy = Math.round((activeDays.reduce((s, e) => s + (e.energy || 0), 0) / activeDays.length) * 10) / 10
    const restEnergy = Math.round((restDays.reduce((s, e) => s + (e.energy || 0), 0) / restDays.length) * 10) / 10
    const diff = Math.round((activeEnergy - restEnergy) * 10) / 10

    let insight = ""
    if (diff >= 0.3) {
      insight = `Physical movement (exercise, walking, yoga) seems to lift your energy by +${diff} ⭐ on average (${activeEnergy} ⭐ vs ${restEnergy} ⭐ on rest days).`
    } else {
      insight = `Your energy stays steady across active days (${activeEnergy} ⭐) and quieter rest days (${restEnergy} ⭐).`
    }

    correlations.push({
      id: "movement_energy",
      icon: "🏃",
      title: "Movement & Energy",
      hasEnoughData: true,
      insight,
      details: `${activeDays.length} active days, ${restDays.length} rest days`,
    })
  } else {
    correlations.push({
      id: "movement_energy",
      icon: "🏃",
      title: "Movement & Energy",
      hasEnoughData: false,
      insight: "Log a couple more active days (walking, gym, exercise) and rest days to uncover energy connections.",
      progress: {
        current: Math.min(activeDays.length, 2) + Math.min(restDays.length, 2),
        required: 4,
        label: "balanced active/rest days",
      },
    })
  }

  // 3. Weekly Mood Rhythm
  const weekdayCount = Object.keys(weekdayMoods).length
  const hasWeekdayData = totalReflections >= 5 && weekdayCount >= 3

  if (hasWeekdayData && happiestWeekday) {
    correlations.push({
      id: "weekday_rhythm",
      icon: "📅",
      title: "Weekly Mood Rhythm",
      hasEnoughData: true,
      insight: `${happiestWeekday}s tend to be your brightest days so far, averaging ${highestWeekdayAvg} out of 5 stars.`,
      details: `Observed across ${totalReflections} reflections in ${weekdayCount} weekdays`,
    })
  } else {
    correlations.push({
      id: "weekday_rhythm",
      icon: "📅",
      title: "Weekly Mood Rhythm",
      hasEnoughData: false,
      insight: "We need reflections across more days of the week to reveal your natural weekday rhythms.",
      progress: {
        current: Math.min(totalReflections, 5),
        required: 5,
        label: "reflections across the week",
      },
    })
  }

  // 4. Hydration & Vitality
  const entriesWithWater = validEntries.filter((e) => Boolean(e.waterLevel))
  const highWater = entriesWithWater.filter((e) => e.waterLevel === "2–3L" || e.waterLevel === "3L+")
  const lowWater = entriesWithWater.filter((e) => e.waterLevel === "<1L" || e.waterLevel === "1–2L")
  const hasWaterData = entriesWithWater.length >= 4 && highWater.length >= 1 && lowWater.length >= 1

  if (hasWaterData) {
    const highEnergy = Math.round((highWater.reduce((s, e) => s + (e.energy || 0), 0) / highWater.length) * 10) / 10
    const lowEnergy = Math.round((lowWater.reduce((s, e) => s + (e.energy || 0), 0) / lowWater.length) * 10) / 10
    const diff = Math.round((highEnergy - lowEnergy) * 10) / 10

    let insight = ""
    if (diff >= 0.3) {
      insight = `Staying well-hydrated (2L+) coincides with higher energy reflections (${highEnergy} ⭐ vs ${lowEnergy} ⭐).`
    } else {
      insight = `Your energy holds steady across different hydration levels (${mostCommonWater} is your most frequent choice).`
    }

    correlations.push({
      id: "hydration_energy",
      icon: "💧",
      title: "Hydration Connection",
      hasEnoughData: true,
      insight,
      details: `${highWater.length} days with 2L+, ${lowWater.length} days with <2L`,
    })
  } else {
    correlations.push({
      id: "hydration_energy",
      icon: "💧",
      title: "Hydration Connection",
      hasEnoughData: false,
      insight: "Log water intake across a few more days to uncover how hydration relates to your vitality.",
      progress: {
        current: entriesWithWater.length,
        required: 4,
        label: "reflections with water logged",
      },
    })
  }

  // 5. Mood Anchor Activity
  if (bestActivityItem && bestActivityItem.count >= 2) {
    correlations.push({
      id: "anchor_activity",
      icon: bestActivityItem.icon || "✨",
      title: "Things That Seem to Help",
      hasEnoughData: true,
      insight: `${bestActivityItem.name} often appears on your happiest days (averaging ${bestActivityItem.avgMood} ⭐, a ${bestActivityItem.moodLift >= 0 ? "+" : ""}${bestActivityItem.moodLift} boost).`,
      details: `Logged in ${bestActivityItem.count} reflections`,
    })
  } else {
    const reflectionsWithActivities = validEntries.filter((e) => (e.activities || []).length > 0).length
    correlations.push({
      id: "anchor_activity",
      icon: "✨",
      title: "Things That Seem to Help",
      hasEnoughData: false,
      insight: "Tag activities on a few more days to see which specific habits give you the highest mood lift.",
      progress: {
        current: Math.min(reflectionsWithActivities, 3),
        required: 3,
        label: "reflections with activities",
      },
    })
  }

  return {
    empty: false,
    totalReflections,
    totalEntries: totalReflections,
    avgMood,
    avgEnergy,
    avgSleep,
    currentStreak,
    longestStreak,
    timeline,
    activityStats,
    correlations,
    mostCommonActivity,
    happiestWeekday,
    mostCommonWater,
    bestActivity,
    bestAvgMood,
    avgMoodGoodSleep,
    avgMoodPoorSleep,
  }
}
