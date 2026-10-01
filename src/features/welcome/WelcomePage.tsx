"use client"

import { useEffect, useMemo, useState } from "react"
import { getDailyQuote } from "@/lib/quotes"
import { Sparkles, ArrowRight } from "lucide-react"
import { getUserName, setUserName } from "@/lib/user"

type Point = { x: number; y: number }

type Head = {
  id: string
  x: number
  y: number
  size: number
  sway: number
  delay: number
}

const CENTER_FADE_RADIUS = 240

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

function HeadNode({
  head,
  mouse,
  viewport,
}: {
  head: Head
  mouse: Point
  viewport: { width: number; height: number }
}) {
  const dx = mouse.x - head.x
  const dy = mouse.y - head.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)

  const maxHeadShift = Math.max(6, head.size * 0.14)
  const headShift = Math.min(distance / 16, maxHeadShift)
  const moveX = Math.cos(angle) * headShift * 0.35
  const moveY = Math.sin(angle) * headShift * 0.35

  const maxPupilShift = Math.max(6, head.size * 0.16)
  const pupilShift = Math.min(distance / 9, maxPupilShift)
  const pupilX = Math.cos(angle) * pupilShift
  const pupilY = Math.sin(angle) * pupilShift
  const scale = 1 + Math.min(distance / Math.max(viewport.width, viewport.height), 0.08) * 0.08

  // Gentle center falloff so text in center stays completely readable while heads seamlessly span the background
  const distFromCenter = Math.sqrt(
    Math.pow(head.x - viewport.width / 2, 2) + Math.pow(head.y - viewport.height * 0.44, 2)
  )
  const centerT = Math.min(1, Math.max(0, distFromCenter / CENTER_FADE_RADIUS))
  // Opacity ranges from 0.45 near center to 1.0 towards edges
  const opacity = 0.45 + centerT * 0.55

  return (
    <div
      className="absolute select-none pointer-events-none"
      style={{
        left: `${head.x}px`,
        top: `${head.y}px`,
        width: `${head.size}px`,
        height: `${head.size}px`,
        opacity,
        transform: `translate(-50%, -50%) translate(${moveX}px, ${moveY}px) scale(${scale})`,
        transition: "transform 80ms ease-out, opacity 400ms ease",
      }}
    >
      <div
        className="relative h-full w-full rounded-full border-[2.5px] border-stone-850 bg-transparent"
        style={{
          boxShadow: `0 0 0 1px rgba(255,255,255,0.7), inset 0 0 0 1px rgba(255,255,255,0.7)`,
        }}
      >
        <span
          className="absolute left-[23%] top-[27%] h-[4.5px] w-[4.5px] rounded-full bg-stone-900"
          style={{
            opacity: 0.95 - head.sway * 0.15,
            transform: `translate(${pupilX}px, ${pupilY}px)`,
            transition: "transform 40ms cubic-bezier(0, 0, 0.2, 1)",
          }}
        />
        <span
          className="absolute left-[45%] top-[27%] h-[4.5px] w-[4.5px] rounded-full bg-stone-900"
          style={{
            opacity: 0.95 - head.sway * 0.15,
            transform: `translate(${pupilX}px, ${pupilY}px)`,
            transition: "transform 40ms cubic-bezier(0, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  )
}

type WelcomeStep =
  | "first_welcome"
  | "first_ask_name"
  | "first_welcomed"
  | "returning_welcome"
  | "quote_revealed"

export function WelcomePage({ onStart }: { onStart: () => void }) {
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
  const [viewport, setViewport] = useState({ width: 1024, height: 768 })

  // User name state
  const initialName = useMemo(() => getUserName(), [])
  const isFirstTime = !initialName
  const [currentName, setCurrentName] = useState(initialName)
  const [nameInput, setNameInput] = useState("")

  // Initial step based on whether username is known
  const [step, setStep] = useState<WelcomeStep>(
    initialName ? "returning_welcome" : "first_welcome"
  )

  // Typewriter text
  const targetText = initialName
    ? `welcome back, ${initialName}`
    : "welcome to moodie"

  const [typedText, setTypedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const quote = useMemo(() => getDailyQuote(), [])

  // Typewriter effect on initial load
  useEffect(() => {
    let index = 0
    const delayTimer = setTimeout(() => {
      const interval = setInterval(() => {
        index++
        setTypedText(targetText.slice(0, index))
        if (index >= targetText.length) {
          clearInterval(interval)
          setIsTyping(false)
        }
      }, 70)

      return () => clearInterval(interval)
    }, 350)

    return () => clearTimeout(delayTimer)
  }, [targetText])

  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) {
      setUserName(trimmed)
      setCurrentName(trimmed)
    }
    setStep("first_welcomed")
  }

  const handleSkipName = () => {
    setStep("first_welcomed")
  }

  // Viewport and mouse movement tracking
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

  // Determine main header text for each step
  const renderHeaderTitle = () => {
    switch (step) {
      case "first_welcome":
      case "returning_welcome":
        return (
          <>
            <span>{typedText}</span>
            {isTyping && (
              <span className="inline-block w-1 h-7 sm:h-9 bg-amber-400 ml-1.5 animate-pulse rounded-full" />
            )}
          </>
        )
      case "first_ask_name":
        return <span>what should i call you?</span>
      case "first_welcomed":
        return <span>{currentName ? `welcome, ${currentName}` : "welcome"}</span>
      case "quote_revealed":
        if (isFirstTime) {
          return <span>{currentName ? `welcome, ${currentName}` : "welcome"}</span>
        }
        return <span>{currentName ? `welcome back, ${currentName}` : "welcome back"}</span>
    }
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#fdf7ec]">
      {/* Background radial gradient to keep ambient warmth soft and balanced */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.35)_0%,rgba(253,247,236,0.3)_50%,rgba(253,247,236,0.85)_100%)]" />

      {/* Eyes Crowd Background */}
      <div className="absolute inset-0 pointer-events-none">
        {heads.map((head) => (
          <HeadNode key={head.id} head={head} mouse={mousePos} viewport={viewport} />
        ))}
      </div>

      {/* Interactive Content Area - Positioned towards center vertically and fixed */}
      <div className="relative z-10 flex h-full flex-col items-center justify-start pt-[23vh] sm:pt-[26vh] px-6 text-center">
        <div className="max-w-md w-full space-y-6">
          {/* Main Title Area */}
          <div className="space-y-2 select-none">
            <h1 className="font-display text-4xl sm:text-5xl text-stone-900 tracking-tight min-h-[52px] sm:min-h-[60px] flex items-center justify-center">
              {renderHeaderTitle()}
            </h1>

            {/* Subtitle: Only shown for first-time welcome, removed when username is known */}
            {step === "first_welcome" && (
              <p
                className={`text-xs sm:text-sm text-stone-500 font-medium tracking-wide transition-opacity duration-700 ${
                  typedText.length >= 7 ? "opacity-100" : "opacity-0"
                }`}
              >
                a gentle reflection companion
              </p>
            )}
          </div>

          {/* Workflow 1: First-time user -> Step 1: "let's get started" */}
          {step === "first_welcome" && !isTyping && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <button
                type="button"
                onClick={() => setStep("first_ask_name")}
                className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-semibold px-7 py-3 text-sm transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md cursor-pointer"
              >
                <span>let&apos;s get started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Workflow 1: First-time user -> Step 2: "what should i call you?" */}
          {step === "first_ask_name" && (
            <div className="space-y-3 pt-1 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName()
                  }}
                  placeholder="your name or nickname"
                  maxLength={24}
                  className="w-full bg-white/55 hover:bg-white/70 focus:bg-white/85 backdrop-blur-md border border-white/80 rounded-2xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-center shadow-xs transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-semibold px-4 py-2.5 text-sm transition-all shadow-xs cursor-pointer hover:scale-105"
                >
                  continue
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleSkipName}
                  className="text-[11px] text-stone-400 hover:text-stone-600 underline cursor-pointer"
                >
                  or continue without a name
                </button>
              </div>
            </div>
          )}

          {/* Workflow 1: First-time user -> Step 3: "welcome [name]" -> "quote of the day" button */}
          {step === "first_welcomed" && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <button
                type="button"
                onClick={() => setStep("quote_revealed")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/55 hover:bg-white/80 backdrop-blur-md text-amber-950 border border-white/80 px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-[0_4px_16px_0_rgba(28,25,23,0.04)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
                <span>quote of the day</span>
              </button>
            </div>
          )}

          {/* Workflow 2: Returning user -> Step 1: "welcome back [name]" -> "quote of the day" button */}
          {step === "returning_welcome" && !isTyping && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3">
              <div>
                <button
                  type="button"
                  onClick={() => setStep("quote_revealed")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/55 hover:bg-white/80 backdrop-blur-md text-amber-950 border border-white/80 px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-[0_4px_16px_0_rgba(28,25,23,0.04)] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
                  <span>quote of the day</span>
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(currentName)
                    setStep("first_ask_name")
                  }}
                  className="text-[11px] text-stone-400 hover:text-stone-600 underline cursor-pointer"
                >
                  change name
                </button>
              </div>
            </div>
          )}

          {/* Quote Revealed -> Frosted glass quote card + "let's begin" button */}
          {step === "quote_revealed" && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500 ease-out">
              {/* Daily Quote Card - Frosted Translucent Glass */}
              <div className="relative overflow-hidden rounded-3xl bg-white/35 backdrop-blur-xl border border-white/60 p-6 sm:p-7 text-left space-y-3.5 shadow-[0_8px_32px_0_rgba(28,25,23,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.8)] transition-all duration-500">
                {/* Subtle glass reflection highlight */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/5 to-transparent" />

                <div className="relative z-10 space-y-3">
                  <span className="text-3xl text-amber-500/90 font-serif leading-none block select-none">“</span>
                  <p className="text-stone-800 text-base sm:text-lg leading-relaxed italic font-serif -mt-2">
                    {quote.quote}
                  </p>
                  <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-900/10">
                    <span className="font-medium text-stone-600">— {quote.source}</span>
                    {quote.tag && (
                      <span className="bg-amber-100/60 text-amber-800/90 text-[10px] px-2.5 py-0.5 rounded-full font-medium border border-amber-200/50 backdrop-blur-xs">
                        {quote.tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Final Start Button */}
              <button
                type="button"
                onClick={onStart}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-semibold px-8 py-3.5 shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
              >
                <span>let&apos;s begin{currentName ? `, ${currentName}` : ""}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
