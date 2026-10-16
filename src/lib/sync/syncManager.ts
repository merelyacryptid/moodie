import { db, ensureHabitsSeeded, recomputeHabitsForDate } from "@/lib/db"
import { loadJournalPrompts, saveJournalPrompts, type JournalPrompt } from "@/lib/prompts"
import {
  getStoredSyncPhrase,
  deriveKeyFromPhrase,
  deriveChannelId,
  encryptPayload,
  decryptPayload,
} from "@/lib/sync/crypto"
import type { Entry, Habit, HabitCompletion } from "@/types"

export interface SyncPackage {
  app: "moodie"
  version: 1
  timestamp: number
  entries: Entry[]
  habits: Habit[]
  completions: HabitCompletion[]
  prompts: JournalPrompt[]
  customActivities: string[]
  hiddenActivities: string[]
  userName?: string
}

export interface SyncResult {
  success: boolean
  syncedAt?: Date
  error?: string
  changesApplied?: number
}

const CUSTOM_KEY = "moodie-custom-activities"
const HIDDEN_KEY = "moodie-hidden-activities"
const USER_KEY = "moodie-user-name"

function getLocalList(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setLocalList(key: string, items: string[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {}
}

/**
 * Packs all current local IndexedDB entries, habits, completions, and settings into a SyncPackage.
 */
export async function packLocalData(): Promise<SyncPackage> {
  const [entries, habits, completions] = await Promise.all([
    db.entries.toArray(),
    db.habits.toArray(),
    db.completions.toArray(),
  ])

  let userName = ""
  try {
    userName = localStorage.getItem(USER_KEY) || ""
  } catch {}

  return {
    app: "moodie",
    version: 1,
    timestamp: Date.now(),
    entries,
    habits,
    completions,
    prompts: loadJournalPrompts(),
    customActivities: getLocalList(CUSTOM_KEY),
    hiddenActivities: getLocalList(HIDDEN_KEY),
    userName,
  }
}

/**
 * Intelligently merges an incoming remote SyncPackage into local IndexedDB without data loss.
 */
export async function mergeRemoteData(remote: SyncPackage): Promise<number> {
  let changesCount = 0

  // 1. Merge Entries
  if (Array.isArray(remote.entries) && remote.entries.length > 0) {
    const localEntries = await db.entries.toArray()
    const localMap = new Map(localEntries.map((e) => [`${e.date}|${e.timeOfDay}`, e]))

    const entriesToPut: Entry[] = []
    const affectedDates = new Set<string>()

    for (const rEntry of remote.entries) {
      const key = `${rEntry.date}|${rEntry.timeOfDay}`
      const local = localMap.get(key)

      if (!local) {
        // New entry from remote device
        entriesToPut.push(rEntry)
        affectedDates.add(rEntry.date)
        changesCount++
      } else {
        // Conflict resolution: Last-Write-Wins based on loggedAt timestamp
        const rTime = rEntry.loggedAt || 0
        const lTime = local.loggedAt || 0
        if (rTime > lTime) {
          entriesToPut.push(rEntry)
          affectedDates.add(rEntry.date)
          changesCount++
        }
      }
    }

    if (entriesToPut.length > 0) {
      await db.entries.bulkPut(entriesToPut)
      for (const d of affectedDates) {
        await recomputeHabitsForDate(d)
      }
    }
  }

  // 2. Merge Habits
  if (Array.isArray(remote.habits) && remote.habits.length > 0) {
    const localHabits = await ensureHabitsSeeded()
    const localIds = new Set(localHabits.map((h) => h.id))

    const newHabits = remote.habits.filter((h) => !localIds.has(h.id))
    if (newHabits.length > 0) {
      await db.habits.bulkPut(newHabits)
      changesCount += newHabits.length
    }
  }

  // 3. Merge Habit Completions (Union)
  if (Array.isArray(remote.completions) && remote.completions.length > 0) {
    const localCompletions = await db.completions.toArray()
    const localMap = new Map(localCompletions.map((c) => [`${c.habitId}|${c.date}`, c]))

    const toPut: HabitCompletion[] = []
    for (const rc of remote.completions) {
      const key = `${rc.habitId}|${rc.date}`
      const lc = localMap.get(key)
      if (!lc) {
        toPut.push(rc)
        changesCount++
      } else if (rc.completed && !lc.completed) {
        // If remote checked it off, preserve completion
        toPut.push(rc)
        changesCount++
      }
    }

    if (toPut.length > 0) {
      await db.completions.bulkPut(toPut)
    }
  }

  // 4. Merge Journal Prompts
  if (Array.isArray(remote.prompts) && remote.prompts.length > 0) {
    const localPrompts = loadJournalPrompts()
    const localIds = new Set(localPrompts.map((p) => p.id))
    const missing = remote.prompts.filter((p) => !localIds.has(p.id))

    if (missing.length > 0 || (localPrompts.length === 0 && remote.prompts.length > 0)) {
      saveJournalPrompts([...localPrompts, ...missing])
      changesCount++
    }
  }

  // 5. Merge Custom Activities (Set Union)
  if (Array.isArray(remote.customActivities) && remote.customActivities.length > 0) {
    const localCustom = getLocalList(CUSTOM_KEY)
    const union = Array.from(new Set([...localCustom, ...remote.customActivities]))
    if (union.length > localCustom.length) {
      setLocalList(CUSTOM_KEY, union)
      changesCount++
    }
  }

  // 6. User Name (Take remote if local is empty)
  if (remote.userName && typeof window !== "undefined") {
    const localName = localStorage.getItem(USER_KEY)
    if (!localName) {
      localStorage.setItem(USER_KEY, remote.userName)
      window.dispatchEvent(new Event("moodie-user-name-changed"))
    }
  }

  return changesCount
}

/**
 * Pushes the current local state encrypted to the blind sync relay.
 */
export async function pushEncryptedSync(): Promise<boolean> {
  const phrase = getStoredSyncPhrase()
  if (!phrase) return false

  try {
    const [key, channelId, data] = await Promise.all([
      deriveKeyFromPhrase(phrase),
      deriveChannelId(phrase),
      packLocalData(),
    ])

    const ciphertext = await encryptPayload(data, key)

    const res = await fetch(`/api/sync/${channelId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: ciphertext }),
    })

    return res.ok
  } catch (err) {
    console.error("Push sync error:", err)
    return false
  }
}

/**
 * Pulls, decrypts, and merges remote data from the blind sync relay.
 */
export async function pullEncryptedSync(): Promise<SyncResult> {
  const phrase = getStoredSyncPhrase()
  if (!phrase) return { success: false, error: "No sync phrase linked" }

  try {
    const [key, channelId] = await Promise.all([
      deriveKeyFromPhrase(phrase),
      deriveChannelId(phrase),
    ])

    const res = await fetch(`/api/sync/${channelId}`)
    if (res.status === 404) {
      // Room doesn't exist yet on server; push local data up to seed it!
      await pushEncryptedSync()
      return { success: true, syncedAt: new Date(), changesApplied: 0 }
    }

    if (!res.ok) {
      return { success: false, error: `Relay responded with status ${res.status}` }
    }

    const { payload } = await res.json()
    if (!payload) {
      return { success: true, syncedAt: new Date(), changesApplied: 0 }
    }

    const remoteData = await decryptPayload<SyncPackage>(payload, key)
    const changesApplied = await mergeRemoteData(remoteData)

    // If local changes were added or merged, push the unified version back to relay
    if (changesApplied > 0) {
      await pushEncryptedSync()
    }

    return {
      success: true,
      syncedAt: new Date(),
      changesApplied,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync error"
    console.error("Pull sync error:", err)
    return { success: false, error: message }
  }
}
