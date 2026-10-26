"use client"

import { useState, useEffect } from "react"
import { TodayPage } from "@/features/today/TodayPage"
import { WelcomePage } from "@/features/welcome/WelcomePage"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // If navigating directly with a date/timeOfDay to edit, bypass the welcome screen
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get("date")) {
        setShowWelcome(false)
        sessionStorage.setItem("moodie-session-entered", "true")
        return
      }
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

  return (
    <ErrorBoundary>
      {showWelcome ? (
        <WelcomePage onStart={handleStart} />
      ) : (
        <TodayPage onShowWelcome={() => setShowWelcome(true)} />
      )}
    </ErrorBoundary>
  )
}
