"use client"

import { useState, useEffect } from "react"
import { TodayPage } from "@/features/today/TodayPage"
import { WelcomePage } from "@/features/welcome/WelcomePage"

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const seen = localStorage.getItem("moodie-welcome-seen")
    if (seen) setShowWelcome(false)
  }, [])

  const handleStart = () => {
    localStorage.setItem("moodie-welcome-seen", "true")
    setShowWelcome(false)
  }

  if (!mounted) return null

  if (showWelcome) return <WelcomePage onStart={handleStart} />

  return <TodayPage />
}
