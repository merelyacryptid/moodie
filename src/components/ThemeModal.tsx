"use client"

import { Check, Palette, X } from "lucide-react"
import { useTheme, THEME_OPTIONS, type MoodieTheme } from "@/hooks/useTheme"

interface ThemeModalProps {
  open: boolean
  onClose: () => void
}

export function ThemeModal({ open, onClose }: ThemeModalProps) {
  const { theme, setTheme } = useTheme()

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-stone-150 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-stone-500" />
              <h3 id="theme-modal-title" className="text-base font-semibold text-stone-800">
                Choose Version
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Pick the aesthetic that feels right for you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id)
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-stone-50/80 border-stone-800 shadow-xs ring-1 ring-stone-800"
                    : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/40 shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full shrink-0 shadow-inner flex items-center justify-center border"
                    style={{
                      backgroundColor: opt.primaryColor,
                      borderColor: opt.accentColor,
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-800 truncate">
                        {opt.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full border bg-stone-100 text-stone-600 border-stone-200">
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {opt.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-stone-800 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-stone-300" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
