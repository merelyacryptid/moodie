"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLiveQuery } from "dexie-react-hooks"
import { CalendarDay } from "@/components/CalendarDay"
import { StarRating } from "@/components/StarRating"
import { moodToEmoji, type Entry } from "@/types"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { db } from "@/lib/db"
import { generateMockEntries } from "@/lib/mockData"
import { MockDataNotice } from "@/components/MockDataNotice"
import { useUserName } from "@/hooks/useUserName"

const TIME_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 }

function MoodChart({ entries }: { entries: Entry[] }) {
  const sorted = [...entries].sort((a, b) => TIME_ORDER[a.timeOfDay] - TIME_ORDER[b.timeOfDay])
  if (sorted.length < 2) return null

  const h = 60
  const w = 120
  const pad = { top: 5, bottom: 20, left: 10, right: 10 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom

  const points = sorted.map((e, i) => {
    const x = pad.left + (i / (sorted.length - 1)) * chartW
    const y = pad.top + chartH - (e.mood / 5) * chartH
    return { x, y, mood: e.mood, timeOfDay: e.timeOfDay }
  })

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")

  return (
    <div className="bg-stone-50 rounded-xl p-3 mt-2">
      <p className="text-xs font-medium text-stone-500 mb-2">Mood across the day</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
        <path d={pathD} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
        ))}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={h - 4} textAnchor="middle" className="text-[8px] fill-stone-400 capitalize">
            {p.timeOfDay}
          </text>
        ))}
        {points.map((p, i) => (
          <text key={`v-${i}`} x={p.x} y={p.y - 7} textAnchor="middle" className="text-[8px] fill-stone-600 font-medium">
            {p.mood}/5
          </text>
        ))}
      </svg>
    </div>
  )
}

export interface CalendarPageProps {
  name?: string
  userName?: string | { name?: string }
}

export function CalendarPage({ name: propName, userName: propUserName }: CalendarPageProps = {}) {
  const { name: hookUserName } = useUserName()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [, setSelectedIndex] = useState(0)

  // Safely extract string name, handling prop string, prop object, or hook fallback
  const userName = useMemo(() => {
    const raw = propUserName ?? propName ?? hookUserName
    if (typeof raw === "string") return raw.trim()
    if (typeof raw === "object" && raw && "name" in raw) {
      return String((raw as any).name || "").trim()
    }
    return ""
  }, [propUserName, propName, hookUserName])

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  // Reactively query all entries from local IndexedDB
  const liveEntries = useLiveQuery(() => db.entries.toArray(), [])
  const isMock = Boolean(liveEntries && liveEntries.length === 0)
  const allEntries = useMemo(() => {
    return isMock ? generateMockEntries() : (liveEntries || [])
  }, [isMock, liveEntries])

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()

  // Group by date
  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of allEntries) {
      const list = map.get(e.date) || []
      list.push(e)
      map.set(e.date, list)
    }
    return map
  }, [allEntries])

  // Get sorted dates for navigation
  const sortedDates = useMemo(
    () => [...entriesByDate.keys()].sort(),
    [entriesByDate]
  )

  const selectedEntries = selectedDate ? (entriesByDate.get(selectedDate) || []) : []
  const sortedSelected = [...selectedEntries].sort((a, b) => TIME_ORDER[a.timeOfDay] - TIME_ORDER[b.timeOfDay])

  const avgMood = sortedSelected.length
    ? Math.round(sortedSelected.reduce((s, e) => s + e.mood, 0) / sortedSelected.length)
    : 0

  const currentDateIdx = selectedDate ? sortedDates.indexOf(selectedDate) : -1

  const goPrevDate = () => {
    if (currentDateIdx > 0) setSelectedDate(sortedDates[currentDateIdx - 1])
  }
  const goNextDate = () => {
    if (currentDateIdx < sortedDates.length - 1) setSelectedDate(sortedDates[currentDateIdx + 1])
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  })
  const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return (
    <div className="space-y-4 sm:space-y-6 w-full transition-all">
      {isMock && <MockDataNotice />}

      <div className="text-center space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-700 transition-all">
          {userName ? `${userName}'s Calendar` : "Calendar"}
        </h1>
        <p className="text-xs sm:text-sm text-stone-400">
          A gentle overview of your daily rhythms
        </p>
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-stone-100 transition-all">
        <button
          onClick={prevMonth}
          className="p-1.5 sm:p-2 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-amber-500 transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <span className="font-display text-base sm:text-xl font-medium text-stone-700">{monthName}</span>
        <button
          onClick={nextMonth}
          className="p-1.5 sm:p-2 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-amber-500 transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-sm border border-stone-100 transition-all">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2">
          {dayNamesShort.map((d, idx) => (
            <div key={d} className="text-center text-xs sm:text-sm font-semibold text-stone-400 py-1">
              <span className="sm:hidden">{d}</span>
              <span className="hidden sm:inline md:hidden">{d}</span>
              <span className="hidden md:inline">{dayNamesFull[idx]}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square w-full" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const dayEntries = entriesByDate.get(dateStr) || []
            const dayAvgMood = dayEntries.length
              ? Math.round(dayEntries.reduce((s, e) => s + e.mood, 0) / dayEntries.length)
              : undefined
            return (
              <CalendarDay
                key={day}
                day={day}
                mood={dayAvgMood}
                hasEntry={dayEntries.length > 0}
                entryCount={dayEntries.length}
                isToday={dateStr === todayStr}
                onClick={() => { setSelectedDate(dateStr); setSelectedIndex(0) }}
              />
            )
          })}
        </div>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={(open) => { if (!open) { setSelectedDate(null); setSelectedIndex(0) } }}>
        <DialogContent className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-sm sm:max-w-md md:max-w-lg w-full">
          {selectedDate && (
            <>
              <DialogTitle className="text-lg sm:text-xl font-semibold text-stone-700 flex items-center justify-between gap-2">
                <button
                  onClick={goPrevDate}
                  disabled={currentDateIdx <= 0}
                  className={`p-1.5 rounded-xl transition-colors ${
                    currentDateIdx > 0
                      ? "text-stone-500 hover:bg-stone-100 hover:text-amber-500 cursor-pointer"
                      : "text-stone-200 cursor-default"
                  }`}
                  aria-label="Previous recorded day"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="flex items-center gap-2">
                  {avgMood > 0 && <span className="text-xl sm:text-2xl">{moodToEmoji(avgMood)}</span>}
                  <span>
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </span>
                </span>
                <button
                  onClick={goNextDate}
                  disabled={currentDateIdx >= sortedDates.length - 1}
                  className={`p-1.5 rounded-xl transition-colors ${
                    currentDateIdx < sortedDates.length - 1
                      ? "text-stone-500 hover:bg-stone-100 hover:text-amber-500 cursor-pointer"
                      : "text-stone-200 cursor-default"
                  }`}
                  aria-label="Next recorded day"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </DialogTitle>

              <DialogDescription className="text-stone-500 sr-only">
                Details for this day
              </DialogDescription>

              {sortedSelected.length > 1 && <MoodChart entries={sortedSelected} />}

              {sortedSelected.length === 0 ? (
                <div className="py-8 text-center text-stone-400 space-y-1">
                  <p className="text-2xl">🌿</p>
                  <p className="text-sm">No reflections recorded for this day.</p>
                </div>
              ) : (
                <div className="space-y-3.5 mt-2 max-h-[60vh] overflow-y-auto pr-1">
                  {sortedSelected.map((entry) => (
                    <div key={entry.id} className="border border-stone-100 rounded-2xl p-3 sm:p-4 bg-stone-50/50">
                      <p className="text-xs font-semibold text-stone-400 capitalize mb-2">{entry.timeOfDay}</p>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-500">Mood</span>
                          <StarRating value={entry.mood} interactive={false} size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-500">Energy</span>
                          <StarRating value={entry.energy} interactive={false} size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-500">Stress</span>
                          <StarRating value={entry.stress} interactive={false} size="sm" />
                        </div>
                        {entry.activities && entry.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {entry.activities.map((act) => {
                              const name = typeof act === "string" ? act : (act as any).activity?.name
                              if (!name) return null
                              return (
                                <span key={name} className="text-xs bg-amber-100/80 text-amber-900 rounded-full px-2.5 py-0.5 font-medium">
                                  {name}
                                </span>
                              )
                            })}
                          </div>
                        )}
                        {entry.note && (
                          <p className="text-xs text-stone-600 bg-white border border-stone-100 rounded-xl p-2.5">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

