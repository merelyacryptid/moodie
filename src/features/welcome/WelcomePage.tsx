"use client"

import { useEffect, useMemo, useState } from "react"

type Point = { x: number; y: number }

type Head = {
  id: string
  x: number
  y: number
  size: number
  sway: number
  delay: number
}

const CENTER_CLEAR_RADIUS = 180

function buildHeads(width: number, height: number): Head[] {
  const heads: Head[] = []
  const cols = Math.max(7, Math.floor(width / 120))
  const rows = Math.max(5, Math.floor(height / 120))
  const stepX = width / cols
  const stepY = height / rows

  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      const x = col * stepX + (row % 2 === 0 ? 0 : stepX * 0.15)
      const y = row * stepY
      const dx = x - width / 2
      const dy = y - height / 2
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

      if (distanceFromCenter < CENTER_CLEAR_RADIUS) continue

      heads.push({
        id: `${row}-${col}`,
        x,
        y,
        size: 54 + ((row + col) % 3) * 10,
        sway: ((row * 13 + col * 7) % 11) / 10,
        delay: ((row * 5 + col * 3) % 12) / 10,
      })
    }
  }

  return heads
}

function HeadNode({ head, mouse, viewport }: { head: Head; mouse: Point; viewport: { width: number; height: number } }) {
  const dx = mouse.x - head.x
  const dy = mouse.y - head.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)

  // Responsive head shift
  const maxHeadShift = Math.max(6, head.size * 0.14)
  const headShift = Math.min(distance / 16, maxHeadShift)
  const moveX = Math.cos(angle) * headShift * 0.35
  const moveY = Math.sin(angle) * headShift * 0.35

  // Snappy, expressive pupil shift directly following cursor
  const maxPupilShift = Math.max(6, head.size * 0.16)
  const pupilShift = Math.min(distance / 9, maxPupilShift)
  const pupilX = Math.cos(angle) * pupilShift
  const pupilY = Math.sin(angle) * pupilShift
  const scale = 1 + Math.min(distance / Math.max(viewport.width, viewport.height), 0.08) * 0.08

  return (
    <div
      className="absolute select-none pointer-events-none"
      style={{
        left: `${head.x}px`,
        top: `${head.y}px`,
        width: `${head.size}px`,
        height: `${head.size}px`,
        transform: `translate(-50%, -50%) translate(${moveX}px, ${moveY}px) scale(${scale})`,
        transition: "transform 80ms ease-out",
      }}
    >
      <div
        className="relative h-full w-full rounded-full border-[3px] border-stone-900 bg-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.7)]"
        style={{
          boxShadow: `0 0 0 1px rgba(255,255,255,0.7), inset 0 0 0 1px rgba(255,255,255,0.7)`,
        }}
      >
        <span
          className="absolute left-[23%] top-[27%] h-[4.5px] w-[4.5px] rounded-full bg-stone-900"
          style={{
            opacity: 0.95 - head.sway * 0.15,
            transform: `translate(${pupilX}px, ${pupilY}px)`,
            // Highly reactive pupil movement for the homepage crowd
            transition: "transform 40ms cubic-bezier(0, 0, 0.2, 1)",
          }}
        />
        <span
          className="absolute left-[45%] top-[27%] h-[4.5px] w-[4.5px] rounded-full bg-stone-900"
          style={{
            opacity: 0.95 - head.sway * 0.15,
            transform: `translate(${pupilX}px, ${pupilY}px)`,
            // Highly reactive pupil movement for the homepage crowd
            transition: "transform 40ms cubic-bezier(0, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  )
}

export function WelcomePage({ onStart }: { onStart: () => void }) {
  const [showTitle, setShowTitle] = useState(false)
  const [showSubtext, setShowSubtext] = useState(false)
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
  const [viewport, setViewport] = useState({ width: 1024, height: 768 })

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300)
    const t2 = setTimeout(() => setShowSubtext(true), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }

    let rafId: number | null = null
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY })
        rafId = null
      })
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener("resize", updateViewport)
      window.removeEventListener("mousemove", handleMouseMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  const heads = useMemo(() => {
    if (!viewport.width || !viewport.height) return []
    return buildHeads(viewport.width, viewport.height)
  }, [viewport.width, viewport.height])

  return (
    <div
      onClick={onStart}
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-[#fdf7ec]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,rgba(253,247,236,0.35)_36%,rgba(253,247,236,1)_72%)]" />

      <div className="absolute inset-0">
        {heads.map((head) => (
          <HeadNode key={head.id} head={head} mouse={mousePos} viewport={viewport} />
        ))}
      </div>

      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-xl">
          <h1
            className={`font-display text-5xl text-stone-900 transition-all duration-[1200ms] ease-out md:text-6xl ${
              showTitle ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            Hi there, welcome
          </h1>

          <p
            className={`mx-auto mt-5 max-w-md text-sm leading-6 text-stone-600 transition-all duration-1000 ${
              showSubtext ? "opacity-100" : "opacity-0"
            }`}
          >
            Click anywhere to begin. The crowd is watching.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStart()
            }}
            className="mt-10 inline-flex items-center justify-center border-2 border-stone-900 bg-white px-6 py-3 font-medium text-stone-900 shadow-[4px_4px_0_0_#1c1917] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  )
}
