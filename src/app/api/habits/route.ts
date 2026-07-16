import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get("month") || "")
  const year = parseInt(searchParams.get("year") || "")

  const habits = await prisma.habit.findMany({
    include: {
      completions: month && year
        ? {
            where: {
              date: {
                gte: `${year}-${String(month).padStart(2, "0")}-01`,
                lte: `${year}-${String(month).padStart(2, "0")}-31`,
              },
            },
          }
        : true,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(habits)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { habitId, date, completed } = body

  const completion = await prisma.habitCompletion.upsert({
    where: { habitId_date: { habitId, date } },
    update: { completed },
    create: { habitId, date, completed },
  })

  return NextResponse.json(completion)
}
