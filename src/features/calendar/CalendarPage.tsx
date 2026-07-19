"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarDay } from "@/components/CalendarDay"
import { StarRating } from "@/components/StarRating"
import { moodToEmoji } from "@/types"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface EntryActivity {
  activity: { name: string }
}

interface Entry {
  id: string
  date: string
  timeOfDay: string
  mood: number
  energy: number
  activityLevel: number
  sleepHours: number
  waterLevel: string
  stress: number
  note: string | null
  activities: EntryActivity[]
}

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

export function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [allEntries, setAllEntries] = useState<Entry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    fetch(`/api/entries?month=${month}&year=${year}`)
      .then((res) => res.json())
      .then(setAllEntries)
  }, [month, year])

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
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-stone-700 text-center">Calendar</h1>

      <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm border border-stone-100">
        <button onClick={prevMonth} className="p-1 hover:text-yellow-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-stone-700">{monthName}</span>
        <button onClick={nextMonth} className="p-1 hover:text-yellow-500 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} />
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
                onClick={() => { setSelectedDate(dateStr); setSelectedIndex(0) }}
              />
            )
          })}
        </div>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={(open) => { if (!open) { setSelectedDate(null); setSelectedIndex(0) } }}>
        <DialogContent className="bg-white rounded-2xl p-5 max-w-sm">
          {selectedDate && (
            <>
              <DialogTitle className="text-lg font-semibold text-stone-700 flex items-center justify-between gap-2">
                <button
                  onClick={goPrevDate}
                  disabled={currentDateIdx <= 0}
                  className={`p-1 rounded-lg transition-colors ${
                    currentDateIdx > 0
                      ? "text-stone-500 hover:bg-stone-100 hover:text-yellow-500"
                      : "text-stone-200 cursor-default"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="flex items-center gap-2">
                  {moodToEmoji(avgMood)}{" "}
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "short", day: "numeric",
                  })}
                </span>
                <button
                  onClick={goNextDate}
                  disabled={currentDateIdx >= sortedDates.length - 1}
                  className={`p-1 rounded-lg transition-colors ${
                    currentDateIdx < sortedDates.length - 1
                      ? "text-stone-500 hover:bg-stone-100 hover:text-yellow-500"
                      : "text-stone-200 cursor-default"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </DialogTitle>

              <DialogDescription className="text-stone-500 sr-only">
                Details for this day
              </DialogDescription>

              {sortedSelected.length > 1 && <MoodChart entries={sortedSelected} />}

              <div className="space-y-4 mt-2 max-h-80 overflow-y-auto">
                {sortedSelected.map((entry) => (
                  <div key={entry.id} className="border border-stone-100 rounded-xl p-3">
                    <p className="text-xs font-medium text-stone-400 capitalize mb-2">{entry.timeOfDay}</p>
                    <div className="space-y-2">
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
                      {entry.activities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.activities.map((ea) => (
                            <span key={ea.activity.name} className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5">
                              {ea.activity.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.note && (
                        <p className="text-xs text-stone-600 bg-stone-50 rounded-lg p-2">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
