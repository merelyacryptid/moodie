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
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[var(--card)] text-[var(--foreground)] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[var(--border)] space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[var(--primary)]" />
              <h3 id="theme-modal-title" className="text-base font-semibold text-[var(--foreground)]">
                Choose Version
              </h3>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Pick the aesthetic that feels right for you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
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
                    ? "bg-[var(--accent)] border-[var(--primary)] shadow-xs ring-1 ring-[var(--primary)]"
                    : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)] shadow-2xs"
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
                      <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {opt.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]">
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">
                      {opt.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[var(--border)]" />
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
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--muted)] hover:opacity-90 text-[var(--foreground)] text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
