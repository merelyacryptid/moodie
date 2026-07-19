"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export function WelcomePage({ onStart }: { onStart: () => void }) {
  const [showTitle, setShowTitle] = useState(false)
  const [showSubtext, setShowSubtext] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const leftEyeRef = useRef<HTMLDivElement>(null)
  const rightEyeRef = useRef<HTMLDivElement>(null)
  const [leftPupil, setLeftPupil] = useState({ x: 0, y: 0 })
  const [rightPupil, setRightPupil] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300)
    const t2 = setTimeout(() => setShowSubtext(true), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const calcPupil = useCallback((el: HTMLDivElement | null) => {
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = mousePos.x - cx
    const dy = mousePos.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    const maxMove = 20
    const move = Math.min(dist / 10, maxMove)
    return { x: Math.cos(angle) * move, y: Math.sin(angle) * move }
  }, [mousePos])

  useEffect(() => {
    setLeftPupil(calcPupil(leftEyeRef.current))
    setRightPupil(calcPupil(rightEyeRef.current))
  }, [calcPupil])

  return (
    <div
      onClick={onStart}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fef9ef] cursor-pointer"
    >
      <h1
        className={`font-display text-4xl text-stone-700 transition-all duration-[1500ms] ease-out ${
          showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        Hi there, welcome
      </h1>

      <div className="flex gap-8 mt-14">
        <div
          ref={leftEyeRef}
          className="w-[72px] h-[72px] bg-white rounded-full shadow-md flex items-center justify-center"
        >
          <div
            className="w-6 h-6 bg-stone-800 rounded-full transition-transform duration-150 ease-out"
            style={{ transform: `translate(${leftPupil.x}px, ${leftPupil.y}px)` }}
          />
        </div>
        <div
          ref={rightEyeRef}
          className="w-[72px] h-[72px] bg-white rounded-full shadow-md flex items-center justify-center"
        >
          <div
            className="w-6 h-6 bg-stone-800 rounded-full transition-transform duration-150 ease-out"
            style={{ transform: `translate(${rightPupil.x}px, ${rightPupil.y}px)` }}
          />
        </div>
      </div>

      <p
        className={`mt-14 text-sm text-stone-400 transition-all duration-1000 ${
          showSubtext ? "opacity-100" : "opacity-0"
        }`}
      >
        Click anywhere to begin
      </p>
    </div>
  )
}
