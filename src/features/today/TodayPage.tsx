"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  Pencil,
  SlidersHorizontal,
  Plus,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  X,
  RefreshCw,
  Keyboard,
  Sun,
  Moon,
  Sparkles,
  Palette,
  Users,
  Calendar,
} from "lucide-react"
import { StarRating } from "@/components/StarRating"
import { ActivityChip } from "@/components/ActivityChip"
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal"
import { ACTIVITIES, WATER_LEVELS, type Entry } from "@/types"
import { getLocalDateString } from "@/lib/utils"
import {
  db,
  saveEntry,
  autoSyncHabit,
  migrateFromSQLiteIfEmpty,
  requestPersistentStorage,
  exportBackup,
  importBackup,
  deleteEntry,
  deleteDayEntries,
} from "@/lib/db"
import {
  loadJournalPrompts,
  saveJournalPrompts,
  resetJournalPrompts,
  getJournalAnswer,
  setJournalAnswer,
  filterPromptsBySlot,
  getCategoryMeta,
  PROMPT_CATEGORIES,
  type JournalPrompt,
  type PromptSlot,
} from "@/lib/prompts"
import { SyncModal } from "@/components/SyncModal"
import { ThemeModal } from "@/components/ThemeModal"
import { pushEncryptedSync, pullEncryptedSync } from "@/lib/sync/syncManager"
import { getStoredSyncPhrase, setStoredSyncPhrase, isValid12WordPhrase } from "@/lib/sync/crypto"
import { useUserName } from "@/hooks/useUserName"

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

const TIME_SLOTS = ["morning", "afternoon", "evening"]

function getDefaultTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}

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

export function TodayPage({ onShowWelcome }: { onShowWelcome?: () => void } = {}) {
  const { name: userName, updateName } = useUserName()
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameEditInput, setNameEditInput] = useState("")

  const [date, setDate] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("date") || getLocalDateString()
    }
    return getLocalDateString()
  })
  const [entry, setEntry] = useState<EntryData>(() => {
    const d = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("date") || getLocalDateString()
      : getLocalDateString()
    const initial = defaultEntry(d)
    if (typeof window !== "undefined") {
      const qTod = new URLSearchParams(window.location.search).get("timeOfDay")
      if (qTod && TIME_SLOTS.includes(qTod)) {
        initial.timeOfDay = qTod
      }
    }
    return initial
  })
  const [drafts, setDrafts] = useState<Record<string, EntryData>>({})
  const [dayEntries, setDayEntries] = useState<Entry[]>([])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [customActivities, setCustomActivities] = useState<string[]>(() => loadList(CUSTOM_KEY))
  const [hiddenActivities, setHiddenActivities] = useState<string[]>(() => loadList(HIDDEN_KEY))
  const [editMode, setEditMode] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
  const [newActivityName, setNewActivityName] = useState("")
  const [tab, setTab] = useState<Tab>("mood")
  const [showBackup, setShowBackup] = useState(false)
  const [backupMessage, setBackupMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Customizable Journal Prompts State
  const [prompts, setPrompts] = useState<JournalPrompt[]>(loadJournalPrompts)
  const [customizingPrompts, setCustomizingPrompts] = useState(false)
  const [customizeFilter, setCustomizeFilter] = useState<PromptSlot | "all">("all")
  const [newPromptText, setNewPromptText] = useState("")
  const [newPromptCategory, setNewPromptCategory] = useState("Reflection")
  const [newPromptSlot, setNewPromptSlot] = useState<PromptSlot>("morning")
  const [newPromptSubtext, setNewPromptSubtext] = useState("")
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [editingPromptText, setEditingPromptText] = useState("")
  const [editingPromptCategory, setEditingPromptCategory] = useState("Reflection")
  const [editingPromptSlot, setEditingPromptSlot] = useState<PromptSlot>("morning")
  const [editingPromptSubtext, setEditingPromptSubtext] = useState("")

  // Journal active view: "auto" (tracks entry.timeOfDay) | "morning" | "evening" | "all"
  const [journalView, setJournalView] = useState<"auto" | "morning" | "evening" | "all">("auto")

  // Deletion States
  const [showDeleteSlotConfirm, setShowDeleteSlotConfirm] = useState(false)
  const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [noticeMessage, setNoticeMessage] = useState("")

  // Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false)

  // Keyboard Shortcuts Modal State
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  // Version / Theme Modal State
  const [showThemeModal, setShowThemeModal] = useState(false)

  // Direct QR/Sync Link Auto-Pairing and Background Sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const syncParam = params.get("sync")
      if (syncParam) {
        const clean = decodeURIComponent(syncParam).trim().toLowerCase().replace(/\s+/g, " ")
        if (isValid12WordPhrase(clean)) {
          setStoredSyncPhrase(clean)
          pullEncryptedSync().then((res) => {
            if (res.success) {
              db.entries.where("date").equals(date).toArray().then(setDayEntries)
              setNoticeMessage("Paired device & synced reflections")
              setTimeout(() => setNoticeMessage(""), 4000)
            }
          })
          window.history.replaceState({}, "", window.location.pathname)
        }
      } else if (getStoredSyncPhrase()) {
        // Automatically check for remote updates on mount/date change
        pullEncryptedSync().then((res) => {
          if (res.success && res.changesApplied && res.changesApplied > 0) {
            db.entries.where("date").equals(date).toArray().then(setDayEntries)
          }
        })
      }
    }
  }, [date])

  useEffect(() => {
    requestPersistentStorage()

    // Seamless one-time migration if switching from older server database
    migrateFromSQLiteIfEmpty().then((migrated) => {
      if (migrated) {
        db.entries.where("date").equals(date).toArray().then(setDayEntries)
      }
    })
  }, [date])

  useEffect(() => {
    setLoading(true)
    setSaved(false)
    setError("")
    setDrafts({})
    const tod = getDefaultTimeOfDay()

    db.entries
      .where("date")
      .equals(date)
      .toArray()
      .then((entries) => {
        setDayEntries(entries)
        const existing = entries.find((e) => e.timeOfDay === tod)
        if (existing) {
          setEntry({
            id: existing.id,
            date: existing.date,
            timeOfDay: existing.timeOfDay,
            mood: existing.mood,
            energy: existing.energy,
            activityLevel: existing.activityLevel,
            sleepHours: existing.sleepHours,
            waterLevel: existing.waterLevel || "",
            stress: existing.stress,
            note: existing.note || "",
            journal: typeof existing.journal === "string" ? existing.journal : "",
            activityNames: Array.isArray(existing.activities) ? existing.activities : [],
          })
        } else {
          setEntry((prev) => ({ ...defaultEntry(date), timeOfDay: prev.timeOfDay }))
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load local reflections:", err)
        setLoading(false)
      })
  }, [date])

  const allActivities = [...ACTIVITIES, ...customActivities].filter((a) => !hiddenActivities.includes(a))

  const updateField = useCallback(<K extends keyof EntryData>(key: K, value: EntryData[K]) => {
    setEntry((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleActivity = useCallback((name: string) => {
    setEntry((prev) => {
      const isAdding = !prev.activityNames.includes(name)
      const nextActivities = isAdding
        ? [...prev.activityNames, name]
        : prev.activityNames.filter((a) => a !== name)

      // Instantly sync habit completion in IndexedDB for immediate real-time update
      autoSyncHabit(name, prev.date, isAdding).catch((err) => {
        console.error("Auto habit sync error:", err)
      })

      return {
        ...prev,
        activityNames: nextActivities,
      }
    })
  }, [])

  const switchTimeOfDay = (tod: string) => {
    if (journalView !== "all") {
      setJournalView("auto")
    }
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
        id: existing.id,
        date: existing.date,
        timeOfDay: existing.timeOfDay,
        mood: existing.mood,
        energy: existing.energy,
        activityLevel: existing.activityLevel,
        sleepHours: existing.sleepHours,
        waterLevel: existing.waterLevel || "",
        stress: existing.stress,
        note: existing.note || "",
        journal: typeof existing.journal === "string" ? existing.journal : "",
        activityNames: Array.isArray(existing.activities) ? existing.activities : [],
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

  // Prompt Customization Handlers
  const handleAddPrompt = () => {
    const text = newPromptText.trim()
    if (!text) return
    const updated: JournalPrompt[] = [
      ...prompts,
      {
        id: `p_${Date.now()}`,
        text,
        category: newPromptCategory.trim() || "Reflection",
        timeOfDay: newPromptSlot,
        subtext: newPromptSubtext.trim() || undefined,
      },
    ]
    setPrompts(updated)
    saveJournalPrompts(updated)
    setNewPromptText("")
    setNewPromptSubtext("")
  }

  const handleStartEditingPrompt = (p: JournalPrompt) => {
    setEditingPromptId(p.id)
    setEditingPromptText(p.text)
    setEditingPromptCategory(p.category || "Reflection")
    setEditingPromptSlot(p.timeOfDay || "all")
    setEditingPromptSubtext(p.subtext || "")
  }

  const handleSaveEditedPrompt = (id: string) => {
    const text = editingPromptText.trim()
    if (!text) return
    const updated = prompts.map((p) =>
      p.id === id
        ? {
            ...p,
            text,
            category: editingPromptCategory.trim() || "Reflection",
            timeOfDay: editingPromptSlot,
            subtext: editingPromptSubtext.trim() || undefined,
          }
        : p
    )
    setPrompts(updated)
    saveJournalPrompts(updated)
    setEditingPromptId(null)
    setEditingPromptText("")
    setEditingPromptSubtext("")
  }

  const handleDeletePrompt = (id: string) => {
    const updated = prompts.filter((p) => p.id !== id)
    setPrompts(updated)
    saveJournalPrompts(updated)
  }

  const handleMovePrompt = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= prompts.length) return
    const updated = [...prompts]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    setPrompts(updated)
    saveJournalPrompts(updated)
  }

  const handleResetPrompts = () => {
    const defaults = resetJournalPrompts()
    setPrompts(defaults)
    setEditingPromptId(null)
  }

  // Deletion Handlers
  const currentSlotEntry = dayEntries.find((e) => e.timeOfDay === entry.timeOfDay)

  const handleDeleteCurrentSlot = async () => {
    if (!currentSlotEntry) return
    setIsDeleting(true)
    try {
      await deleteEntry(currentSlotEntry.id)
      setEntry(defaultEntry(date))
      const updated = await db.entries.where("date").equals(date).toArray()
      setDayEntries(updated)
      setShowDeleteSlotConfirm(false)
      setNoticeMessage(`Deleted ${entry.timeOfDay} reflection.`)
      setTimeout(() => setNoticeMessage(""), 3500)
      pushEncryptedSync().catch(() => {})
    } catch (err) {
      console.error("Delete slot error:", err)
      setError("Failed to delete reflection.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteFullDay = async () => {
    setIsDeleting(true)
    try {
      await deleteDayEntries(date)
      setEntry(defaultEntry(date))
      setDayEntries([])
      setShowDeleteDayConfirm(false)
      setNoticeMessage("Deleted all reflections for this day.")
      setTimeout(() => setNoticeMessage(""), 3500)
      pushEncryptedSync().catch(() => {})
    } catch (err) {
      console.error("Delete day error:", err)
      setError("Failed to delete day.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError("")
    try {
      await saveEntry({
        id: entry.id,
        date: entry.date,
        timeOfDay: entry.timeOfDay as any,
        mood: entry.mood,
        energy: entry.energy,
        activityLevel: entry.activityLevel,
        sleepHours: entry.sleepHours,
        waterLevel: entry.waterLevel,
        stress: entry.stress,
        note: entry.note || null,
        journal: entry.journal || null,
        activities: entry.activityNames,
      })

      // Refresh today's reflections
      const updated = await db.entries.where("date").equals(date).toArray()
      setDayEntries(updated)

      setDrafts((prev) => {
        const next = { ...prev }
        delete next[`${date}|${entry.timeOfDay}`]
        return next
      })
      setSaved(true)

      // Automatically push encrypted update to relay if sync is linked
      pushEncryptedSync().catch(() => {})
    } catch (err) {
      console.error("Save error:", err)
      setError("Failed to save to local database.")
    } finally {
      setSaving(false)
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const res = await importBackup(text)
      if (res.success) {
        setBackupMessage(`Restored ${res.count} reflections!`)
        const updated = await db.entries.where("date").equals(date).toArray()
        setDayEntries(updated)
        setTimeout(() => setBackupMessage(""), 3500)
      } else {
        setBackupMessage("Failed to parse backup file.")
      }
    } catch {
      setBackupMessage("Error reading file.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Keyboard Shortcuts Hook & State Sync Refs
  const handleSubmitRef = useRef(handleSubmit)
  const switchTimeOfDayRef = useRef(switchTimeOfDay)
  const changeDateRef = useRef(changeDate)
  const updateFieldRef = useRef(updateField)
  const entryRef = useRef(entry)
  const tabRef = useRef(tab)
  const savingRef = useRef(saving)

  useEffect(() => {
    handleSubmitRef.current = handleSubmit
    switchTimeOfDayRef.current = switchTimeOfDay
    changeDateRef.current = changeDate
    updateFieldRef.current = updateField
    entryRef.current = entry
    tabRef.current = tab
    savingRef.current = saving
  })

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isEditingText =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true"

      // 1. Universal Quick-Save: Cmd/Ctrl + Enter or Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && (e.key === "Enter" || e.key.toLowerCase() === "s")) {
        e.preventDefault()
        if (savingRef.current) return
        if (tabRef.current === "mood" && entryRef.current.mood === 0) {
          setError("Gently pick a mood star before saving ⭐")
          return
        }
        handleSubmitRef.current()
        return
      }

      // 2. Escape closes open modals
      if (e.key === "Escape") {
        setShowShortcutsModal(false)
        setShowBackup(false)
        setShowSyncModal(false)
        setIsEditingName(false)
        setShowDeleteSlotConfirm(false)
        setShowDeleteDayConfirm(false)
        setCustomizingPrompts(false)
        setShowAddInput(false)
        return
      }

      // If typing in any text input/textarea, do not intercept regular navigation keys
      if (isEditingText) return

      // 3. Question mark (?) toggles the Keyboard Shortcuts Modal
      if (e.key === "?") {
        e.preventDefault()
        setShowShortcutsModal((prev) => !prev)
        return
      }

      // 4. Date Navigation: Alt + ArrowLeft / Alt + ArrowRight
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault()
        changeDateRef.current(-1)
        return
      }
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault()
        changeDateRef.current(1)
        return
      }

      // 5. Direct Slot Jump: Alt + 1, Alt + 2, Alt + 3
      if (e.altKey && (e.key === "1" || e.key === "2" || e.key === "3")) {
        e.preventDefault()
        const slotIdx = parseInt(e.key, 10) - 1
        if (TIME_SLOTS[slotIdx]) {
          switchTimeOfDayRef.current(TIME_SLOTS[slotIdx])
        }
        return
      }

      const isSliderFocused = activeEl?.getAttribute("role") === "slider"

      // 6. Slot Navigation: ArrowLeft / ArrowRight (or [ / ])
      if (!isSliderFocused) {
        if (e.key === "ArrowLeft" || e.key === "[") {
          e.preventDefault()
          const currentIdx = TIME_SLOTS.indexOf(entryRef.current.timeOfDay)
          const nextIdx = (currentIdx - 1 + TIME_SLOTS.length) % TIME_SLOTS.length
          switchTimeOfDayRef.current(TIME_SLOTS[nextIdx])
          return
        }
        if (e.key === "ArrowRight" || e.key === "]") {
          e.preventDefault()
          const currentIdx = TIME_SLOTS.indexOf(entryRef.current.timeOfDay)
          const nextIdx = (currentIdx + 1) % TIME_SLOTS.length
          switchTimeOfDayRef.current(TIME_SLOTS[nextIdx])
          return
        }

        // 7. Quick-log Mood with 1–5 keys when on mood tab
        if (tabRef.current === "mood" && e.key >= "1" && e.key <= "5") {
          e.preventDefault()
          const val = parseInt(e.key, 10)
          updateFieldRef.current("mood", val)
          return
        }
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

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
        <p className="text-stone-500">See you tomorrow{userName ? `, ${userName}` : ""}.</p>
        <button
          onClick={() => setSaved(false)}
          className="mt-4 text-sm text-stone-400 underline underline-offset-2 hover:text-stone-600 cursor-pointer"
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

  const timeGreeting =
    entry.timeOfDay === "morning"
      ? "Good morning"
      : entry.timeOfDay === "afternoon"
      ? "Good afternoon"
      : "Good evening"

  const activeSlot: "morning" | "evening" | "all" =
    journalView === "auto"
      ? entry.timeOfDay === "evening"
        ? "evening"
        : "morning"
      : journalView

  const morningPrompts = useMemo(
    () => prompts.filter((p) => !p.timeOfDay || p.timeOfDay === "morning" || p.timeOfDay === "all"),
    [prompts]
  )
  const eveningPrompts = useMemo(
    () => prompts.filter((p) => !p.timeOfDay || p.timeOfDay === "evening" || p.timeOfDay === "all"),
    [prompts]
  )

  const morningAnsweredCount = useMemo(
    () => morningPrompts.filter((p) => Boolean(getJournalAnswer(entry.journal, p).trim())).length,
    [morningPrompts, entry.journal]
  )
  const eveningAnsweredCount = useMemo(
    () => eveningPrompts.filter((p) => Boolean(getJournalAnswer(entry.journal, p).trim())).length,
    [eveningPrompts, entry.journal]
  )
  const allAnsweredCount = useMemo(
    () => prompts.filter((p) => Boolean(getJournalAnswer(entry.journal, p).trim())).length,
    [prompts, entry.journal]
  )

  const visiblePrompts = useMemo(() => {
    return filterPromptsBySlot(prompts, activeSlot)
  }, [prompts, activeSlot])

  return (
    <div className="space-y-6">
      {/* Inline Name Edit Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-stone-100 text-center animate-in zoom-in-95 duration-200">
            <h3 className="font-semibold text-stone-800 text-base">What should I call you?</h3>
            <input
              type="text"
              value={nameEditInput}
              onChange={(e) => setNameEditInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateName(nameEditInput)
                  setIsEditingName(false)
                }
              }}
              placeholder="your name or nickname"
              maxLength={24}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-sm text-stone-800 text-center focus:outline-none focus:ring-2 focus:ring-amber-300"
              autoFocus
            />
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateName(nameEditInput)
                  setIsEditingName(false)
                }}
                className="px-5 py-2 rounded-xl text-xs bg-yellow-400 hover:bg-yellow-300 font-semibold text-stone-900 shadow-xs cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-center gap-2 mt-1">
          <h1 className="text-2xl font-semibold text-stone-700">
            {userName ? `${timeGreeting}, ${userName}` : "Today's Reflection"}
          </h1>
          <button
            type="button"
            onClick={() => {
              setNameEditInput(userName)
              setIsEditingName(true)
            }}
            title={userName ? `Rename (${userName})` : "Set your name"}
            className="text-stone-300 hover:text-stone-500 transition-colors p-1 cursor-pointer"
            aria-label={userName ? `Rename (${userName})` : "Set your name"}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {onShowWelcome && (
            <button
              onClick={onShowWelcome}
              title="Open the crowd"
              aria-label="Open the crowd"
              className="text-stone-400 hover:text-amber-500 transition-transform hover:scale-110 p-0.5 cursor-pointer"
            >
              <Users className="w-5 h-5 text-stone-400 hover:text-amber-500" />
            </button>
          )}
          <button
            onClick={() => setShowThemeModal(true)}
            title="Choose Theme / Version"
            aria-label="Choose Theme / Version"
            className="text-stone-400 hover:text-amber-600 transition-transform hover:scale-110 p-0.5 cursor-pointer"
          >
            <Palette className="w-5 h-5 text-stone-400 hover:text-amber-500" />
          </button>
          <button
            onClick={() => setShowBackup(true)}
            title="Local Data & Backup"
            className="text-stone-400 hover:text-amber-600 transition-transform hover:scale-110 p-0.5 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-stone-400 hover:text-amber-500" />
          </button>
          <button
            onClick={() => setShowSyncModal(true)}
            title="Cross-Device Sync (QR & 12 Words)"
            className="text-stone-400 hover:text-amber-600 transition-transform hover:scale-110 p-0.5 cursor-pointer"
          >
            <RefreshCw className="w-5 h-5 text-stone-400 hover:text-amber-500" />
          </button>
          <button
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard shortcuts"
            className="text-stone-400 hover:text-amber-600 transition-transform hover:scale-110 p-0.5 cursor-pointer"
          >
            <Keyboard className="w-5 h-5 text-stone-400 hover:text-amber-500" />
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-1 bg-white rounded-2xl p-1 shadow-sm border border-stone-100">
        {TIME_SLOTS.map((slot) => {
          const hasEntry = dayEntries.some((e) => e.timeOfDay === slot)
          return (
            <button
              key={slot}
              onClick={() => switchTimeOfDay(slot)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 cursor-pointer ${
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
            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 cursor-pointer ${
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
              <StarRating label="Mood rating (1 to 5)" value={entry.mood} onChange={(v) => updateField("mood", v)} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Energy</label>
              <StarRating label="Energy rating (1 to 5)" value={entry.energy} onChange={(v) => updateField("energy", v)} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <label className="block text-sm font-medium text-stone-600 mb-2">Activity Level</label>
              <StarRating label="Activity level rating (1 to 5)" value={entry.activityLevel} onChange={(v) => updateField("activityLevel", v)} />
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
              <StarRating label="Stress rating (1 to 5)" value={entry.stress} onChange={(v) => updateField("stress", v)} />
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
                  if (e.target.value.length <= 200) updateField("note", e.target.value)
                }}
                maxLength={200}
                placeholder="Anything small you'd like to remember..."
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
                rows={3}
              />
              <p className="text-xs text-stone-400 text-right mt-1">{entry.note.length}/200</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Journal Header Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-semibold text-stone-800">
                    Journal Reflections
                  </h3>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Gentle prompts to help you reflect, notice patterns, and explore your day.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingPrompts(!customizingPrompts)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  customizingPrompts
                    ? "bg-amber-100 border-amber-300 text-amber-900 font-medium"
                    : "bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-900"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {customizingPrompts ? "Done" : "Customize"}
              </button>
            </div>

            {customizingPrompts ? (
              <div className="space-y-4 bg-stone-50/70 p-3 sm:p-4 rounded-2xl border border-stone-200/70">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-stone-700">Customize Journal Prompts</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Personalize the questions asked during your morning and evening reflections.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPrompts}
                    className="text-[11px] text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Defaults
                  </button>
                </div>

                {/* Filter in Customize */}
                <div className="flex gap-1 bg-white p-1 rounded-xl border border-stone-200/60">
                  {(["all", "morning", "evening"] as const).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setCustomizeFilter(slot)}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        customizeFilter === slot
                          ? "bg-amber-100 text-amber-900 font-semibold"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      {slot === "all" ? "All Prompts" : slot === "morning" ? "Morning / Day" : "Evening"}
                    </button>
                  ))}
                </div>

                {/* List of prompts */}
                <div className="space-y-2">
                  {prompts
                    .filter((p) =>
                      customizeFilter === "all"
                        ? true
                        : customizeFilter === "morning"
                        ? !p.timeOfDay || p.timeOfDay === "morning" || p.timeOfDay === "all"
                        : !p.timeOfDay || p.timeOfDay === "evening" || p.timeOfDay === "all"
                    )
                    .map((p, i) => {
                      const meta = getCategoryMeta(p.category)
                      return (
                        <div
                          key={p.id}
                          className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs space-y-2"
                        >
                          {editingPromptId === p.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingPromptText}
                                onChange={(e) => setEditingPromptText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEditedPrompt(p.id)
                                  if (e.key === "Escape") setEditingPromptId(null)
                                }}
                                placeholder="Question text..."
                                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                                autoFocus
                              />
                              <input
                                type="text"
                                value={editingPromptSubtext}
                                onChange={(e) => setEditingPromptSubtext(e.target.value)}
                                placeholder="Gentle guidance / subtext (optional)..."
                                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                              />
                              <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
                                <div className="flex gap-2">
                                  <select
                                    value={editingPromptSlot}
                                    onChange={(e) => setEditingPromptSlot(e.target.value as PromptSlot)}
                                    className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-700 bg-white"
                                  >
                                    <option value="morning">Morning / Day</option>
                                    <option value="evening">Evening</option>
                                    <option value="all">Any Time</option>
                                  </select>
                                  <select
                                    value={editingPromptCategory}
                                    onChange={(e) => setEditingPromptCategory(e.target.value)}
                                    className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-700 bg-white"
                                  >
                                    {PROMPT_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedPrompt(p.id)}
                                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPromptId(null)}
                                    className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 text-xs hover:bg-stone-50 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                                  >
                                    {p.category || "Reflection"}
                                  </span>
                                  <span className="text-[10px] text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full">
                                    {p.timeOfDay === "morning"
                                      ? "Morning"
                                      : p.timeOfDay === "evening"
                                      ? "Evening"
                                      : "Any time"}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-stone-800">{p.text}</p>
                                {p.subtext && <p className="text-[11px] text-stone-400 italic">{p.subtext}</p>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={i === 0}
                                  onClick={() => handleMovePrompt(i, "up")}
                                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 disabled:opacity-30 cursor-pointer"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={i === prompts.length - 1}
                                  onClick={() => handleMovePrompt(i, "down")}
                                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 disabled:opacity-30 cursor-pointer"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditingPrompt(p)}
                                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePrompt(p.id)}
                                  className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>

                {/* Add new prompt form */}
                <div className="pt-3 border-t border-stone-200/70 space-y-2">
                  <p className="text-xs font-semibold text-stone-700">Add a New Reflection Prompt</p>
                  <input
                    type="text"
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPrompt()
                    }}
                    placeholder="e.g. What is bringing me joy today?"
                    className="w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-300"
                  />
                  <input
                    type="text"
                    value={newPromptSubtext}
                    onChange={(e) => setNewPromptSubtext(e.target.value)}
                    placeholder="Gentle guidance / subtext (optional)..."
                    className="w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-300"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={newPromptSlot}
                      onChange={(e) => setNewPromptSlot(e.target.value as PromptSlot)}
                      className="rounded-xl border border-stone-200 px-2.5 py-1.5 text-xs bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    >
                      <option value="morning">Morning / Day</option>
                      <option value="evening">Evening</option>
                      <option value="all">Any Time</option>
                    </select>
                    <select
                      value={newPromptCategory}
                      onChange={(e) => setNewPromptCategory(e.target.value)}
                      className="rounded-xl border border-stone-200 px-2.5 py-1.5 text-xs bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    >
                      {PROMPT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddPrompt}
                      className="px-4 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Prompt
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode Selector Pill Bar */}
                <div className="flex items-center justify-center gap-1.5 bg-stone-100/70 p-1 rounded-2xl border border-stone-200/50">
                  <button
                    type="button"
                    onClick={() => setJournalView("morning")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeSlot === "morning"
                        ? "bg-white text-stone-800 shadow-xs border border-stone-200/60 font-semibold"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Morning / Day</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                        morningAnsweredCount === morningPrompts.length && morningPrompts.length > 0
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-stone-100 text-stone-500 border-stone-200/50"
                      }`}
                    >
                      {morningAnsweredCount === morningPrompts.length && morningPrompts.length > 0
                        ? "✓"
                        : `${morningAnsweredCount}/${morningPrompts.length}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJournalView("evening")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeSlot === "evening"
                        ? "bg-white text-stone-800 shadow-xs border border-stone-200/60 font-semibold"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Evening</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                        eveningAnsweredCount === eveningPrompts.length && eveningPrompts.length > 0
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-stone-100 text-stone-500 border-stone-200/50"
                      }`}
                    >
                      {eveningAnsweredCount === eveningPrompts.length && eveningPrompts.length > 0
                        ? "✓"
                        : `${eveningAnsweredCount}/${eveningPrompts.length}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJournalView("all")}
                    className={`py-1.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeSlot === "all"
                        ? "bg-white text-stone-800 shadow-xs border border-stone-200/60 font-semibold"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>All</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-500 border border-stone-200/50">
                      {allAnsweredCount}/{prompts.length}
                    </span>
                  </button>
                </div>

                {/* Encouraging Context Card */}
                <div className="bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-orange-50/40 rounded-2xl p-3.5 border border-amber-200/50 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeSlot === "evening" ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      ) : activeSlot === "morning" ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      )}
                      <h4 className="text-xs font-semibold text-amber-950">
                        {activeSlot === "evening"
                          ? "Evening Reflection"
                          : activeSlot === "morning"
                          ? "Morning & Afternoon Intentions"
                          : "All Reflection Prompts"}
                      </h4>
                    </div>
                    <span className="text-[11px] font-medium text-amber-800/80 bg-amber-100/60 px-2 py-0.5 rounded-full border border-amber-200/40">
                      {activeSlot === "evening"
                        ? `${eveningAnsweredCount} of ${eveningPrompts.length} answered`
                        : activeSlot === "morning"
                        ? `${morningAnsweredCount} of ${morningPrompts.length} answered`
                        : `${allAnsweredCount} of ${prompts.length} answered`}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed pl-6">
                    {activeSlot === "evening"
                      ? "Take a calm moment to celebrate your small wins, express gratitude, and gently let go of the day."
                      : activeSlot === "morning"
                      ? "Check in with yourself, set kind intentions, and anchor yourself on what you can control today."
                      : "Explore any prompt that speaks to you right now. No rush, write as little or as much as you like."}
                  </p>
                </div>

                {/* Prompt Cards */}
                <div className="space-y-3">
                  {visiblePrompts.map((q, i) => {
                    const meta = getCategoryMeta(q.category)
                    const currentVal = getJournalAnswer(entry.journal, q, i)
                    const isAnswered = Boolean(currentVal.trim())

                    return (
                      <div
                        key={q.id}
                        className={`rounded-2xl p-4 transition-all duration-200 border ${
                          isAnswered
                            ? "bg-white border-amber-200/70 shadow-xs"
                            : "bg-white border-stone-200/80 shadow-2xs hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                            >
                              <span>{q.category || "Reflection"}</span>
                            </span>

                            {activeSlot === "all" && q.timeOfDay && (
                              <span className="text-[10px] text-stone-500 bg-stone-50 border border-stone-200/60 px-2 py-0.5 rounded-full">
                                {q.timeOfDay === "morning"
                                  ? "Morning / Day"
                                  : q.timeOfDay === "evening"
                                  ? "Evening"
                                  : "Any time"}
                              </span>
                            )}
                          </div>

                          {isAnswered && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Recorded</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-stone-800 mt-2 leading-snug">
                          {q.text}
                        </h4>

                        {q.subtext && (
                          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                            {q.subtext}
                          </p>
                        )}

                        <textarea
                          value={currentVal}
                          onChange={(e) => {
                            const updated = setJournalAnswer(entry.journal, q, i, e.target.value)
                            updateField("journal", updated)
                          }}
                          placeholder={q.placeholder || "Write something from your heart..."}
                          className="w-full mt-2.5 rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 resize-none transition-all leading-relaxed bg-stone-50/40 focus:bg-white"
                          rows={
                            q.id === "p5" || q.id === "p_grateful"
                              ? 3
                              : q.id === "p_comparison" || q.id === "p2" || q.id === "p_goals"
                              ? 3
                              : 2
                          }
                        />

                        {isAnswered && (
                          <div className="flex justify-end mt-1">
                            <span className="text-[10px] text-stone-400">
                              {currentVal.length} characters
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {noticeMessage && (
          <p className="text-xs text-center font-medium text-amber-800 bg-amber-50 py-2 px-3 rounded-xl border border-amber-200 animate-in fade-in">
            {noticeMessage}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <div className="space-y-2">
          {currentSlotEntry && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <span className="text-green-500 font-bold">✓</span> Recorded for {entry.timeOfDay}
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteSlotConfirm(true)}
                className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Delete this reflection
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || (tab === "mood" && entry.mood === 0)}
            className="w-full rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-stone-200 disabled:text-stone-400 text-stone-800 font-medium py-3 px-6 transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          >
            <span>{saving ? "Saving..." : currentSlotEntry ? "Update Reflection" : "Save Reflection"}</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-stone-900/10 text-stone-700 rounded-md">
              ⌘↵
            </kbd>
          </button>

          {dayEntries.length > 0 && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowDeleteDayConfirm(true)}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                Delete entire day ({dayEntries.length} reflection{dayEntries.length > 1 ? "s" : ""})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Current Reflection Confirmation Modal */}
      {showDeleteSlotConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-stone-100 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-stone-800">
                Delete {entry.timeOfDay} reflection?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                This will remove your reflection for this time slot. Your habit completions will be automatically updated.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteSlotConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCurrentSlot}
                className="flex-1 py-2 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Full Day Confirmation Modal */}
      {showDeleteDayConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-stone-100 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-stone-800">
                Delete all reflections for this day?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                This will remove all recorded reflections for {dateStr} and reset all habit checkmarks for this date.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteDayConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteFullDay}
                className="flex-1 py-2 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Day"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-stone-100 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800">Your Local Data</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                moodie is 100% local-first. Your reflections and habits exist solely in your browser&apos;s IndexedDB and never leave your device.
              </p>
            </div>

            {backupMessage && (
              <p className="text-xs text-center font-medium text-amber-700 bg-amber-50 py-1.5 px-3 rounded-xl border border-amber-200/50">
                {backupMessage}
              </p>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={exportBackup}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-100/70 hover:bg-amber-100 text-amber-900 font-medium text-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Export Backup (.json)
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium text-sm transition-all"
              >
                <Upload className="w-4 h-4" />
                Restore from Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowBackup(false)}
              className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cross-Device E2EE Sync Modal */}
      <SyncModal
        open={showSyncModal}
        onOpenChange={setShowSyncModal}
        onSyncComplete={() => {
          db.entries.where("date").equals(date).toArray().then(setDayEntries)
        }}
      />

      {/* Tactile Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        open={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Version / Theme Selector Modal */}
      <ThemeModal
        open={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </div>
  )
}
