"use client"

import React, { Component, type ReactNode } from "react"
import { RefreshCw, RotateCcw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Moodie captured an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  handleResetStorage = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear()
        localStorage.removeItem("moodie-journal-prompts")
      } catch {}
      window.location.href = "/"
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in duration-300">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 max-w-md w-full shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center mx-auto text-xl">
              🌱
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-[var(--foreground)] font-display">
                A gentle pause
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Moodie ran into a small hiccup while loading. Your saved reflections in local storage are safe.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload reflections</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium hover:opacity-80 transition-all cursor-pointer border border-[var(--border)]"
              >
                <span>Try again</span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-left pt-3 border-t border-[var(--border)] text-[11px] text-[var(--muted-foreground)]">
                <summary className="cursor-pointer hover:underline">View technical details</summary>
                <p className="mt-2 font-mono break-all p-2 bg-[var(--muted)] rounded-lg">
                  {this.state.error.message || String(this.state.error)}
                </p>
                <button
                  type="button"
                  onClick={this.handleResetStorage}
                  className="mt-2 text-[10px] text-amber-700 underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset cached prompt settings</span>
                </button>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
