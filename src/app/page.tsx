"use client"

import { useState, useEffect } from "react"
import { TodayPage } from "@/features/today/TodayPage"
import { WelcomePage } from "@/features/welcome/WelcomePage"

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem("moodie-welcome-seen")
    if (seen) setShowWelcome(false)
    setHydrated(true)
  }, [])

  const handleStart = () => {
    sessionStorage.setItem("moodie-welcome-seen", "true")
    setShowWelcome(false)
  }

  if (!hydrated) return null

  if (showWelcome) return <WelcomePage onStart={handleStart} />

  return <TodayPage />
}
