"use client"

import { useState, useEffect, useCallback } from "react"

export type MoodieTheme = "mellow-yellow" | "sarah-pink" | "matte-black"

export interface ThemeOption {
  id: MoodieTheme
  name: string
  subtitle: string
  primaryColor: string
  accentColor: string
  bgColor: string
  tag: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "mellow-yellow",
    name: "Mellow Yellow",
    subtitle: "Warm cream & soothing amber (Default)",
    primaryColor: "#fbbf24",
    accentColor: "#fde68a",
    bgColor: "#fef9ef",
    tag: "Default",
  },
  {
    id: "sarah-pink",
    name: "Sarah Pink",
    subtitle: "Soft blush, dreamy rose & gentle pastel",
    primaryColor: "#fb7185",
    accentColor: "#fecdd3",
    bgColor: "#fff5f7",
    tag: "Blush",
  },
  {
    id: "matte-black",
    name: "Matte Black",
    subtitle: "Sleek, low-contrast dark mode for calm evenings",
    primaryColor: "#e4e4e7",
    accentColor: "#27272a",
    bgColor: "#111113",
    tag: "Dark",
  },
]

export const THEME_STORAGE_KEY = "moodie-theme"

export function getStoredTheme(): MoodieTheme {
  if (typeof window === "undefined") return "mellow-yellow"
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as MoodieTheme | null
    if (stored === "sarah-pink" || stored === "matte-black") return stored
    return "mellow-yellow"
  } catch {
    return "mellow-yellow"
  }
}

export function applyTheme(theme: MoodieTheme) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.setAttribute("data-theme", theme)
    window.dispatchEvent(new CustomEvent("moodie_theme_changed", { detail: theme }))
  } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState<MoodieTheme>("mellow-yellow")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = getStoredTheme()
    setThemeState(initial)
    document.documentElement.setAttribute("data-theme", initial)
    setMounted(true)

    const handleUpdate = () => {
      const current = getStoredTheme()
      setThemeState(current)
      document.documentElement.setAttribute("data-theme", current)
    }

    window.addEventListener("moodie_theme_changed", handleUpdate)
    window.addEventListener("storage", handleUpdate)

    return () => {
      window.removeEventListener("moodie_theme_changed", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [])

  const setTheme = useCallback((nextTheme: MoodieTheme) => {
    setThemeState(nextTheme)
    applyTheme(nextTheme)
  }, [])

  return { theme, setTheme, mounted, options: THEME_OPTIONS }
}
