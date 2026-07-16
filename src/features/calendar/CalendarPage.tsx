"use client"

import { useState, useEffect } from "react"
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
  mood: number
  energy: number
  activityLevel: number
  sleepHours: number
  waterLevel: string
  stress: number
  note: string | null
  activities: EntryActivity[]
}

export function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)

  useEffect(() => {
    fetch(`/api/entries?month=${month}&year=${year}`)
      .then((res) => res.json())
      .then(setEntries)
  }, [month, year])

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()

  const entryMap = new Map(entries.map((e) => [e.date, e]))

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-stone-700 text-center">Calendar</h1>

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
            <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const entry = entryMap.get(dateStr)
            return (
              <CalendarDay
                key={day}
                day={day}
                mood={entry?.mood}
                hasEntry={!!entry}
                onClick={() => setSelectedEntry(entry || null)}
              />
            )
          })}
        </div>
      </div>

      <Dialog open={!!selectedEntry} onOpenChange={(open) => { if (!open) setSelectedEntry(null) }}>
        <DialogContent className="bg-white rounded-2xl p-5 max-w-sm">
          {selectedEntry && (
            <>
              <DialogTitle className="text-lg font-semibold text-stone-700 flex items-center gap-2">
                {moodToEmoji(selectedEntry.mood)}{" "}
                {new Date(selectedEntry.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </DialogTitle>
              <DialogDescription className="text-stone-500 sr-only">
                Details for this day
              </DialogDescription>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Mood</span>
                  <StarRating value={selectedEntry.mood} interactive={false} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Energy</span>
                  <StarRating value={selectedEntry.energy} interactive={false} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Activity Level</span>
                  <StarRating value={selectedEntry.activityLevel} interactive={false} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Stress</span>
                  <StarRating value={selectedEntry.stress} interactive={false} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Sleep</span>
                  <span className="text-sm font-medium text-stone-700">{selectedEntry.sleepHours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Water</span>
                  <span className="text-sm font-medium text-stone-700">{selectedEntry.waterLevel}</span>
                </div>
                {selectedEntry.activities.length > 0 && (
                  <div>
                    <span className="text-sm text-stone-500 block mb-1">Activities</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedEntry.activities.map((ea) => (
                        <span key={ea.activity.name} className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5">
                          {ea.activity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedEntry.note && (
                  <div>
                    <span className="text-sm text-stone-500 block mb-1">Note</span>
                    <p className="text-sm text-stone-700 bg-stone-50 rounded-xl p-2">{selectedEntry.note}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
