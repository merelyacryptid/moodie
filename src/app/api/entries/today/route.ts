import { NextResponse } from "next/server"

// Local-first: reflections are queried directly from IndexedDB on the client
export async function GET() {
  return NextResponse.json([])
}
