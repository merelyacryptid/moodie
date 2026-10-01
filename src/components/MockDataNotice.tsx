"use client"

import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"

export function MockDataNotice() {
  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 shadow-2xs space-y-1.5 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>Sample Preview Mode</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-xl transition-all"
        >
          <span>Log Today</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <p className="text-xs text-amber-800/90 leading-relaxed font-normal">
        Showing sample reflections so you can explore how discoveries and patterns look. Once you start logging your own days in <strong className="font-semibold text-amber-950">Today</strong>, your real reflections will automatically replace this!
      </p>
    </div>
  )
}
