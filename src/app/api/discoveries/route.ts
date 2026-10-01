import { NextResponse } from "next/server"

// Local-first: discoveries are computed on the client from IndexedDB entries
export async function GET() {
  return NextResponse.json({ empty: true })
}
