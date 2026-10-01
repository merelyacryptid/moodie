"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import type { TimelinePoint } from "@/lib/discoveries"
import { moodToEmoji } from "@/types"

interface MoodWaveChartProps {
  timeline: TimelinePoint[]
  avgMood: number
}

// Generate smooth cubic bezier SVG path through points
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  return path
}

export function MoodWaveChart({ timeline, avgMood }: MoodWaveChartProps) {
  const [animated, setAnimated] = useState(false)
  const [activePoint, setActivePoint] = useState<TimelinePoint | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(1500)

  useEffect(() => {
    // Measure path length for stroke animation
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength()
        if (len > 0) setPathLength(len)
      } catch {}
    }

    // Trigger smooth self-drawing animation
    const timer = setTimeout(() => {
      setAnimated(true)
    }, 60)
    return () => clearTimeout(timer)
  }, [timeline.length])

  // Chart dimensions
  const width = 500
  const height = 210
  const pad = { top: 25, right: 30, bottom: 40, left: 35 }
  const plotWidth = width - pad.left - pad.right
  const plotHeight = height - pad.top - pad.bottom

  // Map entries to coordinates
  const { points, linePath, areaPath } = useMemo(() => {
    if (timeline.length === 0) return { points: [], linePath: "", areaPath: "" }

    const pts = timeline.map((entry, idx) => {
      const x =
        timeline.length === 1
          ? pad.left + plotWidth / 2
          : pad.left + (idx / (timeline.length - 1)) * plotWidth
      // Mood is between 1 (or 0.5) and 5. Map 1 -> bottom, 5 -> top
      const normalizedMood = Math.max(0.5, Math.min(5, entry.mood))
      const y = pad.top + plotHeight - ((normalizedMood - 1) / 4) * plotHeight
      return { x, y, entry, idx }
    })

    const lPath = createSmoothPath(pts)
    const firstX = pts[0].x
    const lastX = pts[pts.length - 1].x
    const bottomY = pad.top + plotHeight
    const aPath = `${lPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`

    return { points: pts, linePath: lPath, areaPath: aPath }
  }, [timeline, plotWidth, plotHeight, pad.left, pad.top])

  if (timeline.length < 2) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-100 flex flex-col items-center justify-center text-center py-10 space-y-2">
        <span className="text-3xl animate-bounce">🌊</span>
        <h4 className="font-semibold text-stone-700 text-sm">Your Mood Wave</h4>
        <p className="text-xs text-stone-400 max-w-xs">
          Log at least 2 reflections to watch your personal mood wave begin to flow.
        </p>
      </div>
    )
  }

  // Active display point (either hovered or the latest one)
  const currentDisplayPoint = activePoint || timeline[timeline.length - 1]

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-100 space-y-3">
      {/* Header bar with summary & interactive pill */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🌊</span>
            <h3 className="font-semibold text-stone-800 text-sm">Mood Wave Over Time</h3>
          </div>
          <p className="text-[11px] text-stone-400">
            Self-drawing flow • lighter & brighter indicates higher moments
          </p>
        </div>

        {/* Selected / Latest inspection pill */}
        <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/60 rounded-2xl px-3 py-1 text-xs">
          <span className="text-base">{moodToEmoji(currentDisplayPoint.mood)}</span>
          <div className="leading-tight">
            <span className="font-bold text-amber-900">{currentDisplayPoint.mood} / 5</span>
            <span className="text-[10px] text-amber-700/80 ml-1.5 capitalize">
              {currentDisplayPoint.date.slice(5)} ({currentDisplayPoint.timeOfDay})
            </span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible"
        >
          <defs>
            {/* Height-mapped Gradient for the drawing line:
                Bottom (lower mood) -> Deeper indigo/violet (#6366f1 / #7c3aed)
                Mid (neutral mood) -> Soft sky & amber (#38bdf8 / #fbbf24)
                Top (highest mood) -> Warm bright glowing yellow (#fef08a / #facc15)
            */}
            <linearGradient id="moodLineGradient" x1="0" y1="100%" x2="0" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>

            {/* Subtle luminous area fill below the line */}
            <linearGradient id="moodAreaGradient" x1="0" y1="0%" x2="0" y2="100%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing filter for the line and dots */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Horizontal Rating Reference Guides (5, 4, 3, 2, 1 stars) */}
          {[5, 4, 3, 2, 1].map((rating) => {
            const y = pad.top + plotHeight - ((rating - 1) / 4) * plotHeight
            return (
              <g key={rating}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#f5f5f4"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={pad.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9px] fill-stone-300 font-medium select-none"
                >
                  {rating}★
                </text>
              </g>
            )
          })}

          {/* Soft Gradient Area Fill under the line (fades in after line starts) */}
          <path
            d={areaPath}
            fill="url(#moodAreaGradient)"
            className="transition-opacity duration-1000 ease-out"
            style={{ opacity: animated ? 1 : 0 }}
          />

          {/* Animated Stroke: Draws itself smoothly from left to right */}
          <path
            ref={pathRef}
            d={linePath}
            fill="none"
            stroke="url(#moodLineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: animated ? 0 : pathLength,
              transition: "stroke-dashoffset 2.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {/* Date Labels on X Axis */}
          {points.map((p, i) => {
            // Show date labels selectively if there are many points
            const shouldShowDate =
              points.length <= 8 ||
              i === 0 ||
              i === points.length - 1 ||
              i % Math.ceil(points.length / 5) === 0

            if (!shouldShowDate) return null
            const label = p.entry.date.slice(5) // MM-DD
            return (
              <text
                key={`label-${i}`}
                x={p.x}
                y={height - 12}
                textAnchor="middle"
                className="text-[9px] fill-stone-400 font-medium select-none"
              >
                {label}
              </text>
            )
          })}

          {/* Interactive Interactive Dots on each reflection */}
          {points.map((p, i) => {
            const isHovered = activeIndex === i
            // Color based on mood height
            const dotColor =
              p.entry.mood >= 4
                ? "#f59e0b"
                : p.entry.mood >= 3
                ? "#38bdf8"
                : "#6366f1"

            return (
              <g
                key={`point-${i}`}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => {
                  setActivePoint(p.entry)
                  setActiveIndex(i)
                }}
                onClick={() => {
                  setActivePoint(p.entry)
                  setActiveIndex(i)
                }}
              >
                {/* Invisible large hit area for easy tapping/hovering */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                {/* Outer pulsing ring when hovered */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    fill={dotColor}
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Core dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "5" : "3.5"}
                  fill={dotColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Detail strip for currently inspected point */}
      {currentDisplayPoint && (
        <div className="bg-stone-50/70 border border-stone-100 rounded-2xl p-2.5 flex items-center justify-between text-xs text-stone-600 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-700 capitalize">
              {currentDisplayPoint.date} • {currentDisplayPoint.timeOfDay}
            </span>
            {currentDisplayPoint.activities && currentDisplayPoint.activities.length > 0 && (
              <span className="text-[11px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                {currentDisplayPoint.activities.slice(0, 2).join(", ")}
                {currentDisplayPoint.activities.length > 2 ? ` +${currentDisplayPoint.activities.length - 2}` : ""}
              </span>
            )}
          </div>
          {currentDisplayPoint.note && (
            <p className="text-[11px] text-stone-400 italic truncate max-w-[200px]">
              &ldquo;{currentDisplayPoint.note}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Color Legend explanation */}
      <div className="flex items-center justify-between text-[10px] text-stone-400 px-1 pt-1 border-t border-stone-50">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          Gentle / Low (darker)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
          Neutral (3★)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          High / Radiant (lighter)
        </span>
      </div>
    </div>
  )
}
