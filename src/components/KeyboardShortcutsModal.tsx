"use client"

import { useEffect } from "react"
import { X, Sparkles, Command } from "lucide-react"

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
  detail?: string
}

const SHORTCUT_SECTIONS: { title: string; shortcuts: ShortcutItem[] }[] = [
  {
    title: "⚡ Quick-Log & Save",
    shortcuts: [
      {
        keys: ["⌘ / Ctrl", "Enter"],
        description: "Save reflection instantly",
        detail: "Works from anywhere, even while writing notes",
      },
      {
        keys: ["⌘ / Ctrl", "S"],
        description: "Quick save shortcut",
      },
    ],
  },
  {
    title: "⭐ Tactile Star Ratings",
    shortcuts: [
      {
        keys: ["1", "–", "5"],
        description: "Set star rating",
        detail: "Applies to focused category (Mood, Energy, Activity, Stress)",
      },
      {
        keys: ["←", "→"],
        description: "Adjust rating by half a star",
        detail: "Use on any focused rating slider",
      },
      {
        keys: ["0", "or", "Del"],
        description: "Clear / reset rating to zero",
      },
    ],
  },
  {
    title: "🧭 Time Slots & Dates",
    shortcuts: [
      {
        keys: ["←", "→"],
        description: "Switch reflection slot",
        detail: "Cycles Morning → Afternoon → Evening (when not writing)",
      },
      {
        keys: ["[", "]"],
        description: "Previous / next time slot",
      },
      {
        keys: ["Alt", "1 / 2 / 3"],
        description: "Jump directly to Morning / Afternoon / Evening",
      },
      {
        keys: ["Alt", "←", "/ →"],
        description: "Navigate to yesterday / tomorrow",
      },
    ],
  },
  {
    title: "✨ Navigation & Activities",
    shortcuts: [
      {
        keys: ["Tab", "/ ⇧ Tab"],
        description: "Jump between reflection cards and chips",
      },
      {
        keys: ["Space", "/ ↵"],
        description: "Toggle selected activity chip",
      },
      {
        keys: ["?"],
        description: "Open this keyboard shortcuts cheat sheet",
      },
      {
        keys: ["Esc"],
        description: "Close any modal or dialog",
      },
    ],
  },
]

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-xl border border-stone-100 max-h-[90vh] flex flex-col space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⌨️</span>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">Keyboard Shortcuts</h2>
              <p className="text-xs text-stone-400">Tactile quick-logging designed for speed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            aria-label="Close shortcuts"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="overflow-y-auto space-y-4 pr-1 text-sm">
          {SHORTCUT_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
                {section.title}
              </h3>
              <div className="bg-amber-50/40 rounded-2xl p-2.5 space-y-2 border border-amber-100/60">
                {section.shortcuts.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 text-xs py-1 px-1.5 rounded-lg hover:bg-white/80 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-stone-700 font-medium">{item.description}</div>
                      {item.detail && (
                        <div className="text-[11px] text-stone-400">{item.detail}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-white border border-stone-200 shadow-xs rounded-md text-stone-700"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Press <kbd className="font-mono bg-stone-100 px-1 py-0.5 rounded border text-stone-600">?</kbd> anytime to toggle
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 font-medium text-stone-900 cursor-pointer transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
