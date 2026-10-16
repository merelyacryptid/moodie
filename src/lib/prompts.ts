export interface JournalPrompt {
  id: string
  text: string
  category?: string
}

export const PROMPTS_STORAGE_KEY = "moodie-journal-prompts"

export const DEFAULT_JOURNAL_PROMPTS: JournalPrompt[] = [
  { id: "p1", text: "How am I feeling right now?", category: "Check-in" },
  { id: "p2", text: "What's on my mind?", category: "Reflection" },
  { id: "p3", text: "What am I looking forward to?", category: "Looking Ahead" },
  { id: "p4", text: "What is one thing I can control today?", category: "Mindfulness" },
  { id: "p5", text: "Three things I'm grateful for", category: "Gratitude" },
  { id: "p6", text: "Something I learned today", category: "Growth" },
  { id: "p7", text: "One sentence that sums up today", category: "Summary" },
]

export function loadJournalPrompts(): JournalPrompt[] {
  if (typeof window === "undefined") return DEFAULT_JOURNAL_PROMPTS
  try {
    const raw = localStorage.getItem(PROMPTS_STORAGE_KEY)
    if (!raw) return DEFAULT_JOURNAL_PROMPTS
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => {
        if (typeof item === "string") {
          return { id: `p_legacy_${idx}`, text: item, category: "Custom" }
        }
        return {
          id: item.id || `p_${Date.now()}_${idx}`,
          text: item.text || "",
          category: item.category || "Reflection",
        }
      })
    }
    return DEFAULT_JOURNAL_PROMPTS
  } catch {
    return DEFAULT_JOURNAL_PROMPTS
  }
}

export function saveJournalPrompts(prompts: JournalPrompt[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(prompts))
  } catch (err) {
    console.error("Failed to save journal prompts to localStorage:", err)
  }
}

export function resetJournalPrompts(): JournalPrompt[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(PROMPTS_STORAGE_KEY)
    } catch {}
  }
  return DEFAULT_JOURNAL_PROMPTS
}

/**
 * Safely extracts an answer from the entry's journal string.
 * Supports:
 * 1. Keyed object by prompt.id: { "p1": "answer" }
 * 2. Legacy array format: ["answer0", "answer1"]
 */
export function getJournalAnswer(
  journalStr: string | null | undefined,
  prompt: JournalPrompt,
  index: number
): string {
  if (!journalStr) return ""
  try {
    const parsed = JSON.parse(journalStr)
    if (Array.isArray(parsed)) {
      return typeof parsed[index] === "string" ? parsed[index] : ""
    }
    if (typeof parsed === "object" && parsed !== null) {
      return (
        parsed[prompt.id] ??
        parsed[prompt.text] ??
        parsed[`legacy_${index}`] ??
        ""
      )
    }
    return ""
  } catch {
    return ""
  }
}

/**
 * Updates an answer in the journal string, preserving backwards compatibility with legacy entries.
 */
export function setJournalAnswer(
  journalStr: string | null | undefined,
  prompt: JournalPrompt,
  index: number,
  value: string
): string {
  let answers: Record<string, string> = {}
  if (journalStr) {
    try {
      const parsed = JSON.parse(journalStr)
      if (Array.isArray(parsed)) {
        parsed.forEach((ans, i) => {
          if (typeof ans === "string") answers[`legacy_${i}`] = ans
        })
      } else if (typeof parsed === "object" && parsed !== null) {
        answers = { ...parsed }
      }
    } catch {
      answers = {}
    }
  }

  answers[prompt.id] = value
  return JSON.stringify(answers)
}
