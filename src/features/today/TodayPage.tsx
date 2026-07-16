"use client"

import { useState, useEffect, useCallback } from "react"
import { StarRating } from "@/components/StarRating"
import { ActivityChip } from "@/components/ActivityChip"
import { ACTIVITIES, type WaterLevel, WATER_LEVELS } from "@/types"

interface EntryData {
  id?: string
  date: string
  mood: number
  energy: number
  activityLevel: number
  sleepHours: number
  waterLevel: string
  stress: number
  note: string
  activityNames: string[]
}

const defaultEntry: EntryData = {
  date: new Date().toISOString().split("T")[0],
  mood: 0,
  energy: 0,
  activityLevel: 0,
  sleepHours: 0,
  waterLevel: "",
  stress: 0,
  note: "",
  activityNames: [],
}

export function TodayPage() {
  const [entry, setEntry] = useState<EntryData>(defaultEntry)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/entries/today")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setEntry({
            date: data.date,
            mood: data.mood,
            energy: data.energy,
            activityLevel: data.activityLevel,
            sleepHours: data.sleepHours,
            waterLevel: data.waterLevel,
            stress: data.stress,
            note: data.note || "",
            activityNames: data.activities.map((ea: { activity: { name: string } }) => ea.activity.name),
          })
        }
        setLoading(false)
      })
  }, [])

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

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      })
      if (res.ok) {
        setSaved(true)
      }
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
      </div>
    )
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-stone-400">{dateStr}</p>
        <h1 className="text-2xl font-semibold text-stone-700 mt-1">Today&apos;s Reflection</h1>
      </div>

      <div className="space-y-5">
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
          <label className="block text-sm font-medium text-stone-600 mb-3">Activities</label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map((activity) => (
              <ActivityChip
                key={activity}
                label={activity}
                selected={entry.activityNames.includes(activity)}
                onClick={() => toggleActivity(activity)}
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

        <button
          onClick={handleSubmit}
          disabled={saving || entry.mood === 0}
          className="w-full rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-stone-200 disabled:text-stone-400 text-stone-800 font-medium py-3 px-6 transition-all duration-150"
        >
          {saving ? "Saving..." : "Save Today's Reflection"}
        </button>
      </div>
    </div>
  )
}
