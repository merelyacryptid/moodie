import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

const WDAILY_DIR = "C:/Users/sunil/OneDrive/Documents/Obsidian Vault/wdaily"

const MONTH_MAP: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
}

const ACTIVITY_TO_HABIT: Record<string, string> = {
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

function parseDate(filename: string): string | null {
  const name = filename.replace(/\.md$/, "")
  const match = name.match(/^(\d+)(?:st|nd|rd|th)\s+(\w+)/)
  if (!match) return null
  const day = parseInt(match[1])
  const month = MONTH_MAP[match[2].toLowerCase()]
  if (!month) return null
  // All these files are from July 2026
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function parseMoodValue(text: string): number | null {
  // Strip underscores and en-dashes first, then look for number/5
  const clean = text.replace(/[_\-―]/g, "")
  const match = clean.match(/(\d+(?:\.\d+)?)\s*\/\s*5/)
  return match ? Math.round(parseFloat(match[1])) : null
}

function extractActivities(text: string): string[] {
  const activities: string[] = []
  const lines = text.split("\n")
  let inHabits = false

  for (const line of lines) {
    if (line.includes("## Habits")) { inHabits = true; continue }
    if (inHabits && line.startsWith("## ")) { inHabits = false; continue }
    if (!inHabits) continue

    const checkedMatch = line.match(/-\s*\[[xX]\]\s*(.+)/)
    if (checkedMatch) {
      const raw = checkedMatch[1].trim().toLowerCase()
      if (raw.includes("walk")) activities.push("Walking")
      else if (raw.includes("run")) activities.push("Running")
      else if (raw.includes("exercise") || raw.includes("move") || raw.includes("pilates") || raw.includes("workout") || raw.includes("core")) activities.push("Exercise")
      else if (raw.includes("yoga")) activities.push("Yoga")
      else if (raw.includes("eat breakfast")) activities.push("Cooking")
      else if (raw.includes("read")) activities.push("Reading")
      else if (raw.includes("cook")) activities.push("Cooking")
      else if (raw.includes("music") || raw.includes("sing")) activities.push("Music")
      else if (raw.includes("draw") || raw.includes("art")) activities.push("Drawing")
      else if (raw.includes("code") || raw.includes("dev") || raw.includes("project")) activities.push("Development")
      else if (raw.includes("friend") || raw.includes("social")) activities.push("Friends")
      else if (raw.includes("family")) activities.push("Family")
      else if (raw.includes("nature") || raw.includes("outside") || raw.includes("garden")) activities.push("Nature")
      else if (raw.includes("shop")) activities.push("Shopping")
      else if (raw.includes("clean")) activities.push("Cleaning")
      else if (raw.includes("travel") || raw.includes("trip")) activities.push("Travel")
      else if (raw.includes("movie") || raw.includes("film")) activities.push("Movie")
      else if (raw.includes("tv") || raw.includes("show")) activities.push("TV")
      else if (raw.includes("game") || raw.includes("gaming")) activities.push("Gaming")
      else if (raw.includes("cafe") || raw.includes("coffee")) activities.push("Cafe")
    }
  }
  return [...new Set(activities)]
}

function parseSection(sectionText: string) {
  const lines = sectionText.split("\n")
  let mood: number | null = null
  let energy: number | null = null
  let sleepHours = 0

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes("mood") && /Mood\s*[(-]?\s*\d/i.test(line)) {
      mood = parseMoodValue(line)
    }
    if (lower.includes("energy") && /Energy\s*[(-]?\s*\d/i.test(line)) {
      energy = parseMoodValue(line)
    }
    if (lower.includes("sleep") && /sleep.*\d+(?:\.\d+)?\s*(?:hours?|h|hrs?)/i.test(line)) {
      const match = line.match(/(\d+(?:\.\d+)?)\s*(?:hours?|h|hrs?)/i)
      if (match) sleepHours = parseFloat(match[1])
    }
  }

  const activities = extractActivities(sectionText)
  return { mood, energy, sleepHours, activities }
}

async function importFile(filePath: string, filename: string): Promise<number> {
  const date = parseDate(filename)
  if (!date) {
    console.log(`  Skipping: could not parse date from "${filename}"`)
    return 0
  }

  const content = readFileSync(filePath, "utf-8")
  const sections = content.split(/(?=^# )/m)
  let imported = 0

  for (const section of sections) {
    let timeOfDay: string | null = null
    if (section.startsWith("# Morning")) timeOfDay = "morning"
    else if (section.startsWith("# Afternoon")) timeOfDay = "afternoon"
    else if (section.startsWith("# Evening")) timeOfDay = "evening"
    else continue

    const parsed = parseSection(section)
    if (parsed.mood === null || parsed.energy === null) {
      console.log(`  ${filename} / ${timeOfDay}: skipped (no mood or energy)`)
      continue
    }

    console.log(`  ${filename} / ${timeOfDay}: mood=${parsed.mood}, energy=${parsed.energy}, sleep=${parsed.sleepHours}h, activities=${parsed.activities.join(", ") || "none"}`)

    const existing = await prisma.entry.findUnique({
      where: { date_timeOfDay: { date, timeOfDay } },
    })
    if (existing) {
      console.log(`    Already exists, skipping`)
      continue
    }

    const activityRecords = []
    for (const name of parsed.activities) {
      const activity = await prisma.activity.upsert({
        where: { name },
        update: {},
        create: { name },
      })
      activityRecords.push({ activityId: activity.id })
    }

    const entry = await prisma.entry.create({
      data: {
        date,
        timeOfDay,
        mood: parsed.mood,
        energy: parsed.energy,
        sleepHours: parsed.sleepHours,
        loggedAt: new Date(`${date}T${timeOfDay === "morning" ? "09:00:00" : timeOfDay === "afternoon" ? "14:00:00" : "20:00:00"}`),
      },
    })

    if (activityRecords.length > 0) {
      await prisma.entryActivity.createMany({
        data: activityRecords.map((r) => ({ entryId: entry.id, activityId: r.activityId })),
      })
    }

    const habitNames = [...new Set(
      parsed.activities.map((name) => ACTIVITY_TO_HABIT[name]).filter(Boolean)
    )]
    if (habitNames.length > 0) {
      const habits = await prisma.habit.findMany({
        where: { name: { in: habitNames } },
      })
      for (const habit of habits) {
        await prisma.habitCompletion.upsert({
          where: { habitId_date: { habitId: habit.id, date } },
          update: { completed: true },
          create: { habitId: habit.id, date, completed: true },
        })
      }
    }

    imported++
  }

  if (imported === 0) {
    console.log(`  ${filename}: no sections with mood data`)
  }

  return imported
}

async function main() {
  const files = readdirSync(WDAILY_DIR).filter(
    (f) => f.endsWith(".md") && !["template.md", "July.md", "workout.md"].includes(f) && !f.includes("prompt")
  )
  console.log(`Found ${files.length} wdaily files\n`)

  let total = 0
  for (const file of files.sort()) {
    console.log(`Processing: ${file}`)
    const count = await importFile(join(WDAILY_DIR, file), file)
    total += count
    console.log()
  }

  console.log(`\nDone! Imported ${total} entries total.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
