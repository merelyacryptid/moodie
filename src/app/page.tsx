"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { TodayPage } from "@/features/today/TodayPage"
import { WelcomePage } from "@/features/welcome/WelcomePage"

const welcomeListeners = new Set<() => void>()
let sessionEnteredInMemory = false

function subscribeToWelcomeState(listener: () => void) {
  welcomeListeners.add(listener)
  return () => welcomeListeners.delete(listener)
}

function getWelcomeState() {
  if (sessionEnteredInMemory || new URLSearchParams(window.location.search).has("date")) {
    return true
  }

  try {
    return Boolean(sessionStorage.getItem("moodie-session-entered"))
  } catch {
    return false
  }
}

function notifyWelcomeStateChanged() {
  welcomeListeners.forEach((listener) => listener())
}

export default function Home() {
  const [showWelcomeOverride, setShowWelcomeOverride] = useState<boolean | null>(null)
  const sessionEntered = useSyncExternalStore(
    subscribeToWelcomeState,
    getWelcomeState,
    () => false,
  )

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has("date")) {
        sessionStorage.setItem("moodie-session-entered", "true")
        sessionEnteredInMemory = true
        notifyWelcomeStateChanged()
      }
    } catch {
      // The URL still indicates that the user has entered, even when storage is unavailable.
    }
  }, [])

  const handleStart = () => {
    try {
      sessionStorage.setItem("moodie-session-entered", "true")
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
    sessionEnteredInMemory = true
    setShowWelcomeOverride(false)
    notifyWelcomeStateChanged()
  }

  const showWelcome = showWelcomeOverride ?? !sessionEntered

  if (showWelcome) return <WelcomePage onStart={handleStart} />

  return (
    <TodayPage
      onShowWelcome={() => {
        setShowWelcomeOverride(true)
      }}
    />
  )
}
