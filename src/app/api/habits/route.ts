import { NextResponse } from "next/server"

// Local-first: habits and completions are stored in IndexedDB on the client
export async function GET() {
  return NextResponse.json([])
}

export async function POST() {
  return NextResponse.json({ success: true })
}
