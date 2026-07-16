import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ACTIVITY_TO_HABIT } from "@/types"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, mood, energy, activityLevel, sleepHours, waterLevel, stress, note, activityNames } = body

  const data = {
    date,
    mood,
    energy,
    activityLevel,
    sleepHours,
    waterLevel,
    stress,
    note: note || null,
    activities: {
      deleteMany: {},
      create: await Promise.all(
        (activityNames as string[] || []).map(async (name: string) => {
          const activity = await prisma.activity.upsert({
            where: { name },
            update: {},
            create: { name },
          })
          return { activityId: activity.id }
        })
      ),
    },
  }

  const entry = await prisma.entry.upsert({
    where: { date },
    update: data,
    create: data,
    include: { activities: { include: { activity: true } } },
  })

  const habitNames = [...new Set(
    (activityNames as string[] || [])
      .map((name: string) => ACTIVITY_TO_HABIT[name])
      .filter(Boolean)
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

  return NextResponse.json(entry)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get("month") || "")
  const year = parseInt(searchParams.get("year") || "")

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate = new Date(year, month, 0)
    const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`

    const entries = await prisma.entry.findMany({
      where: { date: { gte: start, lte: end } },
      include: { activities: { include: { activity: true } } },
      orderBy: { date: "asc" },
    })
    return NextResponse.json(entries)
  }

  const entries = await prisma.entry.findMany({
    include: { activities: { include: { activity: true } } },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(entries)
}
