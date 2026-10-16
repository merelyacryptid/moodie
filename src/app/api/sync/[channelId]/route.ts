import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Blind Sync Relay: Stores and serves ONLY encrypted ciphertext blobs.
// Server cannot read, inspect, or decrypt the data because it does not possess the user's secret key.

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await context.params
    if (!channelId || typeof channelId !== "string" || channelId.length < 16) {
      return NextResponse.json({ error: "Invalid channel ID" }, { status: 400 })
    }

    const room = await prisma.syncRoom.findUnique({
      where: { channelId },
    })

    if (!room) {
      return NextResponse.json({ found: false }, { status: 404 })
    }

    return NextResponse.json({
      found: true,
      payload: room.payload,
      version: room.version,
      updatedAt: room.updatedAt.toISOString(),
    })
  } catch (err) {
    console.error("Sync GET error:", err)
    return NextResponse.json({ error: "Internal sync error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await context.params
    if (!channelId || typeof channelId !== "string" || channelId.length < 16) {
      return NextResponse.json({ error: "Invalid channel ID" }, { status: 400 })
    }

    const body = await req.json()
    if (!body || typeof body.payload !== "string") {
      return NextResponse.json({ error: "Payload string required" }, { status: 400 })
    }

    const room = await prisma.syncRoom.upsert({
      where: { channelId },
      update: {
        payload: body.payload,
        version: { increment: 1 },
      },
      create: {
        channelId,
        payload: body.payload,
        version: 1,
      },
    })

    return NextResponse.json({
      success: true,
      version: room.version,
      updatedAt: room.updatedAt.toISOString(),
    })
  } catch (err) {
    console.error("Sync POST error:", err)
    return NextResponse.json({ error: "Internal sync error" }, { status: 500 })
  }
}
