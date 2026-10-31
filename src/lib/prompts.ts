export type PromptSlot = "morning" | "evening" | "all"

export interface JournalPrompt {
  id: string
  text: string
  category?: string
  timeOfDay?: PromptSlot // "morning" (applies to morning & afternoon), "evening", or "all"
  placeholder?: string
  subtext?: string
}

export const PROMPTS_STORAGE_KEY = "moodie-journal-prompts"

export const DEFAULT_MORNING_PROMPTS: JournalPrompt[] = [
  {
    id: "p1",
    text: "How am I feeling right now?",
    category: "Check-in",
    timeOfDay: "morning",
    placeholder: "Notice your mood, body, or emotions in this moment...",
    subtext: "Tune into yourself gently before the day picks up.",
  },
  {
    id: "p2",
    text: "What's on my mind?",
    category: "Reflection",
    timeOfDay: "morning",
    placeholder: "Thoughts, ideas, or things lingering in your mind...",
    subtext: "A safe space to untangle your thoughts.",
  },
  {
    id: "p3",
    text: "What am I looking forward to?",
    category: "Looking Ahead",
    timeOfDay: "morning",
    placeholder: "A warm drink, seeing someone, finishing a task, relaxing...",
    subtext: "Something small or bright to look forward to today.",
  },
  {
    id: "p4",
    text: "What is one thing I can control today?",
    category: "Mindfulness",
    timeOfDay: "morning",
    placeholder: "My breath, how I react, taking a pause, being kind...",
    subtext: "Anchoring yourself in what is within your power.",
  },
  {
    id: "p_goals",
    text: "My goals for today",
    category: "Intention",
    timeOfDay: "morning",
    placeholder: "1–3 gentle focuses or intentions for today...",
    subtext: "Keep them kind, realistic, and motivating.",
  },
]

export const DEFAULT_EVENING_PROMPTS: JournalPrompt[] = [
  {
    id: "p5",
    text: "Three things I'm grateful for",
    category: "Gratitude",
    timeOfDay: "evening",
    placeholder: "1. \n2. \n3. ",
    subtext: "Big or tiny — warm coffee, a kind smile, clean sheets.",
  },
  {
    id: "p6",
    text: "Something I learned today",
    category: "Growth",
    timeOfDay: "evening",
    placeholder: "A new insight, lesson, or small discovery...",
    subtext: "Every day brings a small insight about life or yourself.",
  },
  {
    id: "p_did_well",
    text: "Something I did well today",
    category: "Little Wins",
    timeOfDay: "evening",
    placeholder: "A choice you made, effort you put in, or simply showing up...",
    subtext: "Celebrate yourself — small wins count just as much.",
  },
  {
    id: "p_better_tomorrow",
    text: "One thing I could do better tomorrow",
    category: "Growth",
    timeOfDay: "evening",
    placeholder: "A gentle adjustment or intention for tomorrow, without any self-blame...",
    subtext: "Learning forward with kindness, not self-criticism.",
  },
  {
    id: "p7",
    text: "One sentence that sums up today",
    category: "Summary",
    timeOfDay: "evening",
    placeholder: "Today felt like...",
    subtext: "Capture today's essence in a single gentle sentence.",
  },
  {
    id: "p_comparison",
    text: "When did I measure myself against someone else?",
    category: "Awareness",
    timeOfDay: "evening",
    placeholder: "Notice when comparison crept in, and gently release it. Your journey is yours alone...",
    subtext: "A non-judgmental check-in to notice comparison and return to self-compassion.",
  },
]

export const DEFAULT_JOURNAL_PROMPTS: JournalPrompt[] = [
  ...DEFAULT_MORNING_PROMPTS,
  ...DEFAULT_EVENING_PROMPTS,
]

export const PROMPT_CATEGORIES = [
  "Check-in",
  "Reflection",
  "Looking Ahead",
  "Mindfulness",
  "Intention",
  "Gratitude",
  "Growth",
  "Little Wins",
  "Summary",
  "Awareness",
  "Custom",
] as const

export interface CategoryMeta {
  badgeBg: string
  badgeText: string
  badgeBorder: string
}

export function getCategoryMeta(category?: string): CategoryMeta {
  switch (category) {
    case "Check-in":
      return {
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-800",
        badgeBorder: "border-amber-200/70",
      }
    case "Reflection":
      return {
        badgeBg: "bg-stone-100",
        badgeText: "text-stone-700",
        badgeBorder: "border-stone-200",
      }
    case "Looking Ahead":
      return {
        badgeBg: "bg-sky-50",
        badgeText: "text-sky-800",
        badgeBorder: "border-sky-200/70",
      }
    case "Mindfulness":
      return {
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-800",
        badgeBorder: "border-emerald-200/70",
      }
    case "Intention":
    case "Goals":
      return {
        badgeBg: "bg-teal-50",
        badgeText: "text-teal-800",
        badgeBorder: "border-teal-200/70",
      }
    case "Gratitude":
      return {
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-800",
        badgeBorder: "border-rose-200/70",
      }
    case "Growth":
      return {
        badgeBg: "bg-lime-50",
        badgeText: "text-lime-900",
        badgeBorder: "border-lime-200/70",
      }
    case "Little Wins":
      return {
        badgeBg: "bg-yellow-100/80",
        badgeText: "text-yellow-900",
        badgeBorder: "border-yellow-300/70",
      }
    case "Summary":
      return {
        badgeBg: "bg-violet-50",
        badgeText: "text-violet-800",
        badgeBorder: "border-violet-200/70",
      }
    case "Awareness":
      return {
        badgeBg: "bg-indigo-50",
        badgeText: "text-indigo-800",
        badgeBorder: "border-indigo-200/70",
      }
    default:
      return {
        badgeBg: "bg-stone-50",
        badgeText: "text-stone-700",
        badgeBorder: "border-stone-200",
      }
  }
}

export function loadJournalPrompts(): JournalPrompt[] {
  if (typeof window === "undefined") return DEFAULT_JOURNAL_PROMPTS
  try {
    const raw = localStorage.getItem(PROMPTS_STORAGE_KEY)
    if (!raw) return DEFAULT_JOURNAL_PROMPTS
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validItems = parsed.filter((item) => item !== null && item !== undefined)
      if (validItems.length === 0) return DEFAULT_JOURNAL_PROMPTS

      const hasTimeOfDay = validItems.some(
        (item) => typeof item === "object" && Boolean(item.timeOfDay)
      )

      // Seamlessly upgrade legacy prompts missing timeOfDay
      if (!hasTimeOfDay) {
        const existingIds = new Set(
          validItems.map((item) => (typeof item === "object" ? item.id : null))
        )
        const migrated: JournalPrompt[] = validItems.map((item, idx) => {
          if (typeof item === "string") {
            return { id: `p_legacy_${idx}`, text: item, category: "Custom", timeOfDay: "all" }
          }
          const defaultMatch = DEFAULT_JOURNAL_PROMPTS.find(
            (d) =>
              (item.id && d.id === item.id) ||
              (item.text && d.text.toLowerCase() === (item.text || "").toLowerCase())
          )
          return {
            id: item.id || `p_${Date.now()}_${idx}`,
            text: item.text || "",
            category: item.category || defaultMatch?.category || "Reflection",
            timeOfDay: item.timeOfDay || defaultMatch?.timeOfDay || "all",
            placeholder: item.placeholder || defaultMatch?.placeholder,
            subtext: item.subtext || defaultMatch?.subtext,
          }
        })

        // Ensure newly introduced default prompts are included
        for (const def of DEFAULT_JOURNAL_PROMPTS) {
          const alreadyExists =
            existingIds.has(def.id) ||
            migrated.some((m) => m.text && m.text.toLowerCase() === def.text.toLowerCase())
          if (!alreadyExists) {
            migrated.push(def)
          }
        }
        saveJournalPrompts(migrated)
        return migrated
      }

      return validItems.map((item, idx) => {
        if (typeof item === "string") {
          return { id: `p_legacy_${idx}`, text: item, category: "Custom", timeOfDay: "all" }
        }
        const defaultMatch = DEFAULT_JOURNAL_PROMPTS.find(
          (d) =>
            (item.id && d.id === item.id) ||
            (item.text && d.text.toLowerCase() === (item.text || "").toLowerCase())
        )
        return {
          id: item.id || `p_${Date.now()}_${idx}`,
          text: item.text || "",
          category: item.category || defaultMatch?.category || "Reflection",
          timeOfDay: item.timeOfDay || defaultMatch?.timeOfDay || "all",
          placeholder: item.placeholder || defaultMatch?.placeholder,
          subtext: item.subtext || defaultMatch?.subtext,
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
 * Filter prompts according to active slot or user choice.
 * "morning" and "afternoon" both show morning prompts.
 * "evening" shows evening prompts.
 * "all" returns all prompts.
 */
export function filterPromptsBySlot(
  prompts: JournalPrompt[],
  slot: "morning" | "afternoon" | "evening" | "all"
): JournalPrompt[] {
  if (!Array.isArray(prompts)) return []
  if (slot === "all") return prompts
  if (slot === "morning" || slot === "afternoon") {
    return prompts.filter((p) => !p.timeOfDay || p.timeOfDay === "morning" || p.timeOfDay === "all")
  }
  return prompts.filter((p) => !p.timeOfDay || p.timeOfDay === "evening" || p.timeOfDay === "all")
}

/**
 * Safely extracts an answer from the entry's journal string.
 * Supports:
 * 1. Keyed object by prompt.id: { "p1": "answer" }
 * 2. Keyed object by prompt.text
 * 3. Legacy array format: ["answer0", "answer1"]
 * Guaranteed to return a valid string.
 */
export function getJournalAnswer(
  journalStr: string | null | undefined,
  prompt?: JournalPrompt | null,
  index?: number
): string {
  if (!journalStr || !prompt) return ""
  try {
    const parsed = JSON.parse(journalStr)
    if (Array.isArray(parsed)) {
      if (typeof index === "number" && typeof parsed[index] === "string") {
        return parsed[index]
      }
      return ""
    }
    if (typeof parsed === "object" && parsed !== null) {
      const rawVal =
        (prompt.id ? (parsed as any)[prompt.id] : undefined) ??
        (prompt.text ? (parsed as any)[prompt.text] : undefined) ??
        (typeof index === "number" ? (parsed as any)[`legacy_${index}`] : undefined) ??
        ""
      if (typeof rawVal === "string") return rawVal
      if (typeof rawVal === "number" || typeof rawVal === "boolean") return String(rawVal)
      return ""
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
  index: number | undefined,
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

  if (prompt && prompt.id) {
    answers[prompt.id] = typeof value === "string" ? value : String(value ?? "")
  }
  return JSON.stringify(answers)
}

/**
 * Returns all answered prompts and answers for display in Calendar or summaries.
 */
export function getAllJournalAnswers(
  journalStr: string | null | undefined,
  prompts: JournalPrompt[]
): Array<{ prompt: JournalPrompt; answer: string }> {
  if (!journalStr || !Array.isArray(prompts)) return []
  const results: Array<{ prompt: JournalPrompt; answer: string }> = []
  prompts.forEach((p, idx) => {
    if (!p) return
    const ans = getJournalAnswer(journalStr, p, idx).trim()
    if (ans) {
      results.push({ prompt: p, answer: ans })
    }
  })
  return results
}
