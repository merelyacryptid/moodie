import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ACTIVITY_TO_HABIT } from "@/types"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, timeOfDay, mood, energy, activityLevel, sleepHours, waterLevel, stress, note, journal, activityNames } = body
  const tod = timeOfDay || "morning"
  const names = (activityNames as string[]) || []

  const activityRecords = await Promise.all(
    names.map(async (name: string) => {
      const activity = await prisma.activity.upsert({
        where: { name },
        update: {},
        create: { name },
      })
      return { activityId: activity.id }
    })
  )

  // Delete existing entry activities for this date+timeOfDay before upsert
  const existing = await prisma.entry.findUnique({
    where: { date_timeOfDay: { date, timeOfDay: tod } },
  })
  if (existing) {
    await prisma.entryActivity.deleteMany({ where: { entryId: existing.id } })
  }

  const entry = await prisma.entry.upsert({
    where: { date_timeOfDay: { date, timeOfDay: tod } },
    update: {
      mood,
      energy,
      activityLevel: activityLevel ?? 0,
      sleepHours: sleepHours ?? 0,
      waterLevel: waterLevel ?? "",
      stress: stress ?? 0,
      note: note || null,
      journal: journal || null,
      loggedAt: new Date(),
    },
    create: {
      date,
      timeOfDay: tod,
      mood,
      energy,
      activityLevel: activityLevel ?? 0,
      sleepHours: sleepHours ?? 0,
      waterLevel: waterLevel ?? "",
      stress: stress ?? 0,
      note: note || null,
      journal: journal || null,
      loggedAt: new Date(),
    },
    include: { activities: { include: { activity: true } } },
  })

  if (activityRecords.length > 0) {
    await prisma.entryActivity.createMany({
      data: activityRecords.map((r) => ({ entryId: entry.id, activityId: r.activityId })),
    })
  }

  // Auto-complete matching habits
  const habitNames = [...new Set(
    names.map((name: string) => ACTIVITY_TO_HABIT[name]).filter(Boolean)
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

  const updated = await prisma.entry.findUnique({
    where: { id: entry.id },
    include: { activities: { include: { activity: true } } },
  })

  return NextResponse.json(updated)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")
  const month = parseInt(searchParams.get("month") || "")
  const year = parseInt(searchParams.get("year") || "")

  if (date) {
    const entries = await prisma.entry.findMany({
      where: { date },
      include: { activities: { include: { activity: true } } },
      orderBy: { timeOfDay: "asc" },
    })
    return NextResponse.json(entries)
  }

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate = new Date(year, month, 0)
    const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`

    const entries = await prisma.entry.findMany({
      where: { date: { gte: start, lte: end } },
      include: { activities: { include: { activity: true } } },
      orderBy: [{ date: "asc" }, { timeOfDay: "asc" }],
    })
    return NextResponse.json(entries)
  }

  const entries = await prisma.entry.findMany({
    include: { activities: { include: { activity: true } } },
    orderBy: [{ date: "desc" }, { timeOfDay: "asc" }],
  })
  return NextResponse.json(entries)
}
