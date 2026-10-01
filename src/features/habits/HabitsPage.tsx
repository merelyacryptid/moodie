"use client"

import { useState, useCallback, useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, toggleHabitCompletion } from "@/lib/db"
import type { Habit as DbHabit, HabitCompletion as DbHabitCompletion } from "@/types"

interface HabitWithCompletions extends DbHabit {
  completions: DbHabitCompletion[]
}

export function HabitsPage() {
  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())

  // Query live local habits and completions from IndexedDB
  const liveHabits = useLiveQuery(() => db.habits.toArray(), []) || []
  const liveCompletions = useLiveQuery(() => db.completions.toArray(), []) || []

  const habits: HabitWithCompletions[] = useMemo(() => {
    return liveHabits.map((h) => ({
      ...h,
      completions: liveCompletions.filter((c) => c.habitId === h.id && c.completed !== false),
    }))
  }, [liveHabits, liveCompletions])

  const daysInMonth = new Date(year, month, 0).getDate()

  const completionMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const habit of habits) {
      const completedDates = new Set(habit.completions.map((c) => c.date))
      map.set(habit.id, completedDates)
    }
    return map
  }, [habits])

  const toggleHabit = useCallback(
    async (habitId: string, day: number | string, currentCompleted: boolean) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      await toggleHabitCompletion(habitId, dateStr, !currentCompleted)
    },
    [month, year]
  )

  function calcStreak(habit: HabitWithCompletions): { current: number; longest: number } {
    const sorted = habit.completions
      .map((c) => c.date)
      .sort()

    if (sorted.length === 0) return { current: 0, longest: 0 }

    let longest = 1
    let current = 0
    let streak = 1

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) {
        streak++
      } else if (diff > 1) {
        longest = Math.max(longest, streak)
        streak = 1
      }
    }
    longest = Math.max(longest, streak)

    // Check if today or yesterday is in the streak
    const today = new Date().toISOString().split("T")[0]
    const lastDate = sorted[sorted.length - 1]
    const diffFromToday = Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
    if (diffFromToday <= 1) {
      current = streak
    }

    return { current, longest }
  }

  function calcPercentage(habit: HabitWithCompletions): number {
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`
    const completed = habit.completions.filter((c) => c.date.startsWith(monthPrefix)).length
    return Math.round((completed / daysInMonth) * 100)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-stone-700 text-center">Habits</h1>

      <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-stone-400 font-medium p-1 sticky left-0 bg-white min-w-[100px]">
                Habit
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i} className="text-center text-stone-400 font-medium p-1 w-7">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const completedDates = completionMap.get(habit.id) || new Set()
              const streak = calcStreak(habit)
              const percentage = calcPercentage(habit)

              return (
                <tr key={habit.id}>
                  <td className="sticky left-0 bg-white p-1">
                    <div className="flex items-center gap-1.5">
                      <span>{habit.icon}</span>
                      <span className="font-medium text-stone-700 text-xs">{habit.name}</span>
                      <span className="text-[10px] text-stone-400 ml-auto">{percentage}%</span>
                    </div>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    const completed = completedDates.has(dateStr)
                    return (
                      <td key={day} className="text-center p-0.5">
                        <button
                          onClick={() => toggleHabit(habit.id, day.toString(), completed)}
                          className={`w-5 h-5 rounded-md transition-all duration-150 ${
                            completed
                              ? "opacity-100 hover:opacity-80"
                              : "opacity-30 hover:opacity-60"
                          }`}
                          style={{
                            backgroundColor: completed ? habit.color : "#e7e5e4",
                          }}
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {habits.map((habit) => {
        const streak = calcStreak(habit)
        return (
          <div key={habit.id} className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{habit.icon}</span>
                <span className="text-sm font-medium text-stone-700">{habit.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-500">
                <span>🔥 {streak.current} day{streak.current !== 1 ? "s" : ""}</span>
                <span>🏆 {streak.longest} day{streak.longest !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
