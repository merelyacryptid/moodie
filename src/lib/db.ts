import Dexie, { type EntityTable, type Table } from "dexie"
import type { Entry, Habit, HabitCompletion } from "@/types"
import { ACTIVITY_TO_HABIT, HABIT_TO_ACTIVITIES } from "@/types"

export const db = new Dexie("moodie") as Dexie & {
  entries: EntityTable<Entry, "id">
  habits: EntityTable<Habit, "id">
  completions: Table<HabitCompletion, [string, string]>
}

// Version 1 schema with indexes for fast querying
db.version(1).stores({
  entries: "id, date, timeOfDay, &[date+timeOfDay], *activities",
  habits: "id, name",
  completions: "[habitId+date], habitId, date",
})

// Default habits on first populate in the browser
export const DEFAULT_HABITS: Habit[] = [
  { id: "Reading", name: "Reading", icon: "📖", color: "#fde68a" },
  { id: "CP", name: "CP", icon: "💻", color: "#bbf7d0" },
  { id: "Development", name: "Development", icon: "⚡", color: "#bfdbfe" },
  { id: "Study", name: "Study", icon: "📚", color: "#c7d2fe" },
  { id: "Exercise", name: "Exercise", icon: "🏃", color: "#fed7aa" },
  { id: "Go Outside", name: "Go Outside", icon: "🌿", color: "#d9f99d" },
  { id: "Movie", name: "Movie", icon: "🎬", color: "#fecaca" },
]

// Ensure habits exist in IndexedDB (handles fresh browsers or upgraded databases)
export async function ensureHabitsSeeded(): Promise<Habit[]> {
  try {
    const existing = await db.habits.toArray()
    if (existing.length > 0) return existing
    await db.habits.bulkAdd(DEFAULT_HABITS)
    return await db.habits.toArray()
  } catch {
    return DEFAULT_HABITS
  }
}

// Seed default habits on first launch in the browser
db.on("populate", () => {
  db.habits.bulkAdd(DEFAULT_HABITS)
})

// Request persistent storage so the browser doesn't clear IndexedDB under storage pressure
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== "undefined" && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist()
    } catch {
      return false
    }
  }
  return false
}

// Save or update an entry and sync corresponding habits
export async function saveEntry(
  entryData: Omit<Entry, "id" | "loggedAt"> & { id?: string; loggedAt?: number }
): Promise<Entry> {
  // Check if an entry already exists for this date and timeOfDay
  const existing = await db.entries
    .where("[date+timeOfDay]")
    .equals([entryData.date, entryData.timeOfDay])
    .first()

  const id = existing?.id || entryData.id || crypto.randomUUID()
  const fullEntry: Entry = {
    ...entryData,
    id,
    loggedAt: Date.now(),
  }

  // Put entry into local IndexedDB
  await db.entries.put(fullEntry)

  // Automatically mark habit completions based on chosen activities
  const allHabits = await ensureHabitsSeeded()
  const habitMap = new Map(allHabits.map((h) => [h.name.toLowerCase(), h.id]))

  for (const activity of fullEntry.activities) {
    const habitName = ACTIVITY_TO_HABIT[activity] || activity
    const habitId = habitMap.get(habitName.toLowerCase()) || habitName

    await db.completions.put({
      habitId,
      date: fullEntry.date,
      completed: true,
    })
  }

  return fullEntry
}

// Real-time synchronization when selecting activities
export async function autoSyncHabit(
  activityOrHabit: string,
  date: string,
  completed: boolean
): Promise<void> {
  const allHabits = await ensureHabitsSeeded()
  const habitName = ACTIVITY_TO_HABIT[activityOrHabit] || activityOrHabit
  const habit = allHabits.find((h) => h.name.toLowerCase() === habitName.toLowerCase())
  const habitId = habit?.id || habitName

  if (completed) {
    await db.completions.put({ habitId, date, completed: true })
  } else {
    // Check if other reflections on this date also have this habit
    const entriesOnDate = await db.entries.where("date").equals(date).toArray()
    const matchingActivities = (HABIT_TO_ACTIVITIES[habitName] || [habitName]).map((a) => a.toLowerCase())
    const stillActive = entriesOnDate.some((e) =>
      Array.isArray(e.activities) && e.activities.some((a) => matchingActivities.includes(a.toLowerCase()))
    )

    if (stillActive) {
      await db.completions.put({ habitId, date, completed: false })
    } else {
      await db.completions.delete([habitId, date])
    }
  }
}

// Toggle habit completion on a given date (with override support)
export async function toggleHabitCompletion(
  habitId: string,
  date: string,
  completed: boolean
): Promise<void> {
  const allHabits = await ensureHabitsSeeded()
  const habit =
    allHabits.find((h) => h.id === habitId) ||
    allHabits.find((h) => h.name.toLowerCase() === habitId.toLowerCase())
  const targetId = habit?.id || habitId

  if (completed) {
    await db.completions.put({ habitId: targetId, date, completed: true })
  } else {
    // Explicitly record false so user can override any auto-completed activity from reflections
    await db.completions.put({ habitId: targetId, date, completed: false })
  }
}

// One-time automatic migration helper from SQLite / API if local IndexedDB is fresh
export async function migrateFromSQLiteIfEmpty(): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const count = await db.entries.count()
    if (count > 0) return false // Already has local data

    // Fetch existing entries from the legacy API route if available
    const res = await fetch("/api/entries")
    if (!res.ok) return false

    const serverEntries = await res.json()
    if (!Array.isArray(serverEntries) || serverEntries.length === 0) return false

    const formattedEntries: Entry[] = serverEntries.map((e: any) => ({
      id: e.id || crypto.randomUUID(),
      date: e.date,
      timeOfDay: e.timeOfDay || "morning",
      mood: Number(e.mood) || 0,
      energy: Number(e.energy) || 0,
      activityLevel: Number(e.activityLevel) || 0,
      sleepHours: Number(e.sleepHours) || 0,
      waterLevel: e.waterLevel || "",
      stress: Number(e.stress) || 0,
      note: e.note || null,
      journal: e.journal || null,
      activities: Array.isArray(e.activities)
        ? e.activities.map((a: any) => (typeof a === "string" ? a : a.activity?.name || ""))
        : [],
      loggedAt: e.loggedAt ? new Date(e.loggedAt).getTime() : Date.now(),
    }))

    await db.entries.bulkPut(formattedEntries)

    // Ensure default habits exist
    const habitCount = await db.habits.count()
    if (habitCount === 0) {
      await db.habits.bulkAdd(DEFAULT_HABITS)
    }

    return true
  } catch {
    return false
  }
}

// Export local data to a JSON backup file
export async function exportBackup(): Promise<void> {
  const [entries, habits, completions] = await Promise.all([
    db.entries.toArray(),
    db.habits.toArray(),
    db.completions.toArray(),
  ])

  const backupData = {
    app: "moodie",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    habits,
    completions,
  }

  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `moodie-backup-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Import data from a backup JSON string
export async function importBackup(jsonString: string): Promise<{ success: boolean; count: number }> {
  try {
    const data = JSON.parse(jsonString)
    if (!data || !Array.isArray(data.entries)) {
      throw new Error("Invalid backup format")
    }

    if (data.entries.length > 0) {
      await db.entries.bulkPut(data.entries)
    }
    if (Array.isArray(data.habits) && data.habits.length > 0) {
      await db.habits.bulkPut(data.habits)
    }
    if (Array.isArray(data.completions) && data.completions.length > 0) {
      await db.completions.bulkPut(data.completions)
    }

    return { success: true, count: data.entries.length }
  } catch (err) {
    console.error("Failed to import backup:", err)
    return { success: false, count: 0 }
  }
}