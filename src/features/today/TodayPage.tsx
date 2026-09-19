"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StarRating } from "@/components/StarRating"
import { ActivityChip } from "@/components/ActivityChip"
import { ACTIVITIES, WATER_LEVELS } from "@/types"
import { getLocalDateString } from "@/lib/utils"

interface EntryData {
  id?: string
  date: string
  timeOfDay: string
  mood: number
  energy: number
  activityLevel: number
  sleepHours: number
  waterLevel: string
  stress: number
  note: string
  journal: string
  activityNames: string[]
}

interface EntryResponse {
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
  journal: string | null
  activities: { activity: { name: string } }[]
}

const TIME_SLOTS = ["morning", "afternoon", "evening"]

function getDefaultTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}

const JOURNAL_QUESTIONS = [
  "How am I feeling right now?",
  "What's on my mind?",
  "What am I looking forward to?",
  "What is one thing I can control today?",
  "Three things I'm grateful for",
  "Something I learned today",
  "One sentence that sums up today",
]

const defaultEntry = (date: string): EntryData => ({
  date,
  timeOfDay: getDefaultTimeOfDay(),
  mood: 0,
  energy: 0,
  activityLevel: 0,
  sleepHours: 0,
  waterLevel: "",
  stress: 0,
  note: "",
  journal: "",
  activityNames: [],
})

const CUSTOM_KEY = "moodie-custom-activities"
const HIDDEN_KEY = "moodie-hidden-activities"

function loadList(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveList(key: string, items: string[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

type Tab = "mood" | "journal"

export function TodayPage() {
  const [date, setDate] = useState(getLocalDateString())
  const [entry, setEntry] = useState<EntryData>(defaultEntry(getLocalDateString()))
  const [drafts, setDrafts] = useState<Record<string, EntryData>>({})
  const [dayEntries, setDayEntries] = useState<EntryResponse[]>([])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [customActivities, setCustomActivities] = useState<string[]>([])
  const [hiddenActivities, setHiddenActivities] = useState<string[]>([])
  const [editMode, setEditMode] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
  const [newActivityName, setNewActivityName] = useState("")
  const [tab, setTab] = useState<Tab>("mood")

  useEffect(() => {
    setCustomActivities(loadList(CUSTOM_KEY))
    setHiddenActivities(loadList(HIDDEN_KEY))
  }, [])

  useEffect(() => {
    setLoading(true)
    setSaved(false)
    setError("")
    setDrafts({})
    const tod = getDefaultTimeOfDay()

    fetch(`/api/entries/today?date=${date}`)
      .then((res) => res.json())
      .then((entries: EntryResponse[]) => {
        setDayEntries(entries)
        const existing = entries.find((e) => e.timeOfDay === tod)
        if (existing) {
          setEntry({
            date: existing.date,
            timeOfDay: existing.timeOfDay,
            mood: existing.mood,
            energy: existing.energy,
            activityLevel: existing.activityLevel,
            sleepHours: existing.sleepHours,
            waterLevel: existing.waterLevel,
            stress: existing.stress,
            note: existing.note || "",
            journal: existing.journal || "",
            activityNames: existing.activities.map((ea) => ea.activity.name),
          })
        } else {
          setEntry((prev) => ({ ...defaultEntry(date), timeOfDay: prev.timeOfDay }))
        }
        setLoading(false)
      })
  }, [date])

  const allActivities = [...ACTIVITIES, ...customActivities].filter((a) => !hiddenActivities.includes(a))

  const updateField = useCallback(<K extends keyof EntryData>(key: K, value: EntryData[K]) => {
    setEntry((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleActivity = useCallback((name: string) => {
    setEntry((prev) => ({
      ...prev,
      activityNames: prev.activityNames.includes(name)
        ? prev.activityNames.filter((a) => a !== name)
        : [...prev.activityNames, name],
    }))
  }, [])

  const switchTimeOfDay = (tod: string) => {
    setDrafts((prev) => ({
      ...prev,
      [`${date}|${entry.timeOfDay}`]: entry,
    }))

    const draftKey = `${date}|${tod}`
    if (drafts[draftKey]) {
      setEntry(drafts[draftKey])
      return
    }

    const existing = dayEntries.find((e) => e.timeOfDay === tod)
    if (existing) {
      setEntry({
        date: existing.date,
        timeOfDay: existing.timeOfDay,
        mood: existing.mood,
        energy: existing.energy,
        activityLevel: existing.activityLevel,
        sleepHours: existing.sleepHours,
        waterLevel: existing.waterLevel,
        stress: existing.stress,
        note: existing.note || "",
        journal: existing.journal || "",
        activityNames: existing.activities.map((ea) => ea.activity.name),
      })
    } else {
      setEntry({ ...defaultEntry(date), timeOfDay: tod })
    }
  }

  const changeDate = (delta: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    setDate(`${y}-${m}-${day}`)
  }

  const addCustomActivity = () => {
    const name = newActivityName.trim()
    if (!name || allActivities.includes(name)) return
    const updated = [...customActivities, name]
    setCustomActivities(updated)
    saveList(CUSTOM_KEY, updated)
    if (hiddenActivities.includes(name)) {
      const unhidden = hiddenActivities.filter((a) => a !== name)
      setHiddenActivities(unhidden)
      saveList(HIDDEN_KEY, unhidden)
    }
    setNewActivityName("")
    setShowAddInput(false)
  }

  const removeActivity = (name: string) => {
    if (customActivities.includes(name)) {
      const updated = customActivities.filter((a) => a !== name)
      setCustomActivities(updated)
      saveList(CUSTOM_KEY, updated)
    } else {
      const updated = [...hiddenActivities, name]
      setHiddenActivities(updated)
      saveList(HIDDEN_KEY, updated)
    }
    setEntry((prev) => ({
      ...prev,
      activityNames: prev.activityNames.filter((a) => a !== name),
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      })
      if (res.ok) {
        setDrafts((prev) => {
          const next = { ...prev }
          delete next[`${date}|${entry.timeOfDay}`]
          return next
        })
        setSaved(true)
      } else {
        const text = await res.text()
        setError(text || "Something went wrong")
      }
    } catch {
      setError("Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-stone-400">Loading...</p>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-semibold text-stone-700 mb-2">Another star added.</h2>
        <p className="text-stone-500">See you tomorrow.</p>
        <button
          onClick={() => setSaved(false)}
          className="mt-4 text-sm text-stone-400 underline underline-offset-2 hover:text-stone-600"
        >
          {date === getLocalDateString() ? "Log another time of day" : "Continue"}
        </button>
      </div>
    )
  }

  const displayDate = new Date(date + "T12:00:00")
  const dateStr = displayDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const isToday = date === getLocalDateString()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => changeDate(-1)} className="p-1 text-stone-400 hover:text-yellow-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="text-sm text-stone-400">{dateStr}</p>
          <button onClick={() => changeDate(1)} className="p-1 text-stone-400 hover:text-yellow-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {!isToday && (
          <button
            onClick={() => setDate(getLocalDateString())}
            className="text-xs text-yellow-500 underline underline-offset-2 mt-0.5"
          >
            Back to today
          </button>
        )}
        <h1 className="text-2xl font-semibold text-stone-700 mt-1">Today's Reflection</h1>
      </div>

      <div className="flex justify-center gap-1 bg-white rounded-2xl p-1 shadow-sm border border-stone-100">
        {TIME_SLOTS.map((slot) => {
          const hasEntry = dayEntries.some((e) => e.timeOfDay === slot)
          return (
            <button
              key={slot}
              onClick={() => switchTimeOfDay(slot)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                entry.timeOfDay === slot
                  ? "bg-yellow-200 text-yellow-900 shadow-sm"
                  : hasEntry
                    ? "text-stone-500 bg-stone-50"
                    : "text-stone-400 hover:bg-stone-50"
              }`}
            >
              {slot}
              {hasEntry && <span className="ml-1 text-xs">✓</span>}
            </button>
          )
        })}
      </div>

      <div className="flex justify-center gap-1 bg-white rounded-2xl p-1 shadow-sm border border-stone-100">
        {(["mood", "journal"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-yellow-200 text-yellow-900 shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {t === "mood" ? "Mood" : "Journal"}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {tab === "mood" ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Mood</label>
              <StarRating value={entry.mood} onChange={(v) => updateField("mood", v)} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Energy</label>
              <StarRating value={entry.energy} onChange={(v) => updateField("energy", v)} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Activity Level</label>
              <StarRating value={entry.activityLevel} onChange={(v) => updateField("activityLevel", v)} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Sleep (hours)</label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={entry.sleepHours || ""}
                onChange={(e) => updateField("sleepHours", parseFloat(e.target.value) || 0)}
                className="w-24 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Water</label>
              <select
                value={entry.waterLevel}
                onChange={(e) => updateField("waterLevel", e.target.value)}
                className="rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                <option value="">Select...</option>
                {WATER_LEVELS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Stress</label>
              <StarRating value={entry.stress} onChange={(v) => updateField("stress", v)} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-stone-600">Activities</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditMode(!editMode)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      editMode
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                    }`}
                  >
                    {editMode ? "Done" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddInput(true)}
                    className="text-xs px-2 py-1 rounded-full border border-stone-200 text-stone-500 hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
              {showAddInput && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustomActivity() }}
                    placeholder="New activity..."
                    className="flex-1 rounded-xl border border-stone-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={addCustomActivity}
                    className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-800 text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {allActivities.map((activity) => (
                  <ActivityChip
                    key={activity}
                    label={activity}
                    selected={entry.activityNames.includes(activity)}
                    onClick={() => toggleActivity(activity)}
                    onRemove={editMode ? () => removeActivity(activity) : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Tiny Note</label>
              <textarea
                value={entry.note}
                onChange={(e) => {
                  if (e.target.value.length <= 120) updateField("note", e.target.value)
                }}
                placeholder="Anything small you'd like to remember..."
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
                rows={3}
              />
              <p className="text-xs text-stone-400 text-right mt-1">{entry.note.length}/120</p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 space-y-4">
            <label className="block text-sm font-medium text-stone-600">Journal</label>
            <p className="text-xs text-stone-400 -mt-2">
              Optional. Just for you — nobody else reads this.
            </p>
            {JOURNAL_QUESTIONS.map((q, i) => (
              <div key={i}>
                <label className="block text-xs font-medium text-stone-500 mb-1">{q}</label>
                <textarea
                  value={
                    entry.journal
                      ? (JSON.parse(entry.journal)?.[i] ?? "")
                      : ""
                  }
                  onChange={(e) => {
                    const answers = entry.journal ? JSON.parse(entry.journal) : []
                    answers[i] = e.target.value
                    updateField("journal", JSON.stringify(answers))
                  }}
                  placeholder="Write something..."
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving || (tab === "mood" && entry.mood === 0)}
          className="w-full rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-stone-200 disabled:text-stone-400 text-stone-800 font-medium py-3 px-6 transition-all duration-150"
        >
          {saving ? "Saving..." : "Save Reflection"}
        </button>
      </div>
    </div>
  )
}
