import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getLocalToday() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || getLocalToday()
  const timeOfDay = searchParams.get("timeOfDay") || null

  if (timeOfDay) {
    const entry = await prisma.entry.findUnique({
      where: { date_timeOfDay: { date, timeOfDay } },
      include: { activities: { include: { activity: true } } },
    })
    return NextResponse.json(entry)
  }

  const entries = await prisma.entry.findMany({
    where: { date },
    include: { activities: { include: { activity: true } } },
    orderBy: { timeOfDay: "asc" },
  })
  return NextResponse.json(entries)
}
