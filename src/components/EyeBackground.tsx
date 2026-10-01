"use client"

import { useEffect, useMemo, useState, useRef } from "react"

type Point = { x: number; y: number }

type Head = {
  id: string
  x: number
  y: number
  size: number
  sway: number
}

function buildBackgroundHeads(width: number, height: number): Head[] {
  const heads: Head[] = []
  const step = 125
  const cols = Math.max(6, Math.floor(width / step))
  const rows = Math.max(5, Math.floor(height / step))
  const stepX = width / cols
  const stepY = height / rows

  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      const x = col * stepX + (row % 2 === 0 ? 0 : stepX * 0.25)
      const y = row * stepY
      heads.push({
        id: `bg-head-${row}-${col}`,
        x,
        y,
        size: 46 + ((row * 7 + col * 5) % 3) * 8,
        sway: ((row * 11 + col * 13) % 10) / 10,
      })
    }
  }

  return heads
}

function BackgroundHeadNode({ head, mouse }: { head: Head; mouse: Point }) {
  const dx = mouse.x - head.x
  const dy = mouse.y - head.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)

  // Subtle and gentle shift for the general background
  const maxShift = Math.max(3, head.size * 0.08)
  const pupilShift = Math.min(distance / 35, maxShift)
  const pupilX = Math.cos(angle) * pupilShift
  const pupilY = Math.sin(angle) * pupilShift

  return (
    <div
      className="absolute select-none pointer-events-none"
      style={{
        left: `${head.x}px`,
        top: `${head.y}px`,
        width: `${head.size}px`,
        height: `${head.size}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="relative h-full w-full rounded-full border-[1.5px] border-stone-500/25 bg-transparent">
        {/* Left eye pupil */}
        <span
          className="absolute left-[24%] top-[28%] h-[3.5px] w-[3.5px] rounded-full bg-stone-700/35"
          style={{
            transform: `translate(${pupilX}px, ${pupilY}px)`,
            // Very slow, dreamy transition for the general app background
            transition: "transform 2.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Right eye pupil */}
        <span
          className="absolute left-[46%] top-[28%] h-[3.5px] w-[3.5px] rounded-full bg-stone-700/35"
          style={{
            transform: `translate(${pupilX}px, ${pupilY}px)`,
            transition: "transform 2.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  )
}

export function EyeBackground() {
  const [mounted, setMounted] = useState(false)
  const [viewport, setViewport] = useState({ width: 1200, height: 800 })
  const [mousePos, setMousePos] = useState<Point>({ x: 600, y: 400 })
  const lastUpdateRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
    const updateSize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
      setMousePos((prev) => ({
        x: prev.x || window.innerWidth / 2,
        y: prev.y || window.innerHeight / 2,
      }))
    }

    updateSize()
    window.addEventListener("resize", updateSize)

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      // Throttle mouse updates to ~120ms so it has near-zero overhead on the main app
      if (now - lastUpdateRef.current < 100) return
      lastUpdateRef.current = now

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY })
      })
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener("resize", updateSize)
      window.removeEventListener("mousemove", handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const heads = useMemo(() => {
    if (!viewport.width || !viewport.height) return []
    return buildBackgroundHeads(viewport.width, viewport.height)
  }, [viewport.width, viewport.height])

  if (!mounted) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.16] select-none transition-opacity duration-700"
    >
      {heads.map((head) => (
        <BackgroundHeadNode key={head.id} head={head} mouse={mousePos} />
      ))}
    </div>
  )
}
