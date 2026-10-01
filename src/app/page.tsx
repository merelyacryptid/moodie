"use client"

import { useState, useEffect } from "react"
import { TodayPage } from "@/features/today/TodayPage"
import { WelcomePage } from "@/features/welcome/WelcomePage"

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Use sessionStorage so the welcome page greets you on every new app visit/session,
    // but stays dismissed throughout your use in this session.
    try {
      const sessionEntered = sessionStorage.getItem("moodie-session-entered")
      if (sessionEntered) setShowWelcome(false)
    } catch {}
  }, [])

  const handleStart = () => {
    try {
      sessionStorage.setItem("moodie-session-entered", "true")
    } catch {}
    setShowWelcome(false)
  }

  if (!mounted) return null

  if (showWelcome) return <WelcomePage onStart={handleStart} />

  return <TodayPage onShowWelcome={() => setShowWelcome(true)} />
}
