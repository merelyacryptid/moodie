export type WaterLevel = "<1L" | "1–2L" | "2–3L" | "3L+"

export const WATER_LEVELS: WaterLevel[] = ["<1L", "1–2L", "2–3L", "3L+"]

export const ACTIVITIES = [
  "Reading",
  "Competitive Programming",
  "Development",
  "Study",
  "Exercise",
  "Walking",
  "Running",
  "Gym",
  "Yoga",
  "Movie",
  "TV",
  "Gaming",
  "Music",
  "Drawing",
  "Art",
  "Cooking",
  "Friends",
  "Family",
  "Nature",
  "Cafe",
  "Shopping",
  "Cleaning",
  "Travel",
  "Coding",
] as const

export const ACTIVITY_TO_HABIT: Record<string, string> = {
  Reading: "Reading",
  "Competitive Programming": "CP",
  Development: "Development",
  Study: "Study",
  Exercise: "Exercise",
  Walking: "Exercise",
  Running: "Exercise",
  Gym: "Exercise",
  Yoga: "Exercise",
  Movie: "Movie",
  TV: "Movie",
  Nature: "Go Outside",
  Coding: "Development",
}

export function moodToEmoji(mood: number): string {
  const map: Record<number, string> = {
    1: "😔",
    2: "😐",
    3: "🙂",
    4: "😊",
    5: "😁",
  }
  return map[mood] ?? "🙂"
}

export function moodToColor(mood: number): string {
  if (mood >= 4) return "bg-yellow-200"
  if (mood === 3) return "bg-amber-100"
  if (mood === 2) return "bg-sky-200"
  return "bg-purple-200"
}
