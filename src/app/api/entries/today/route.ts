import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getTodayDate() {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

export async function GET() {
  const today = getTodayDate()
  const entry = await prisma.entry.findUnique({
    where: { date: today },
    include: { activities: { include: { activity: true } } },
  })
  return NextResponse.json(entry)
}
