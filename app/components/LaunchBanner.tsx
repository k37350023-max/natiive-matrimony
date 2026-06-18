'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function LaunchBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('my_profile_id'))
  }, [])

  if (dismissed) return null
  return (
    <div className="border-b px-4 py-2.5" style={{ background: '#FEF9EC', borderColor: '#F0E4C0' }}>
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold shrink-0" style={{ color: '#B45309' }}>Launch offer</span>
          <span className="text-stone-300 text-xs shrink-0">·</span>
          <span className="text-xs text-stone-600 truncate">All features free until 30 Sept 2026 — no credit card or subscription</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {!isLoggedIn && (
            <Link href="/register"
              className="text-xs font-semibold px-3 py-1 rounded-md border"
              style={{ color: '#B45309', borderColor: '#E8C99A', background: 'white' }}>
              Join free
            </Link>
          )}
          <button
            onClick={e => { e.stopPropagation(); setDismissed(true) }}
            className="text-stone-400 hover:text-stone-600 transition-colors p-1"
            aria-label="Dismiss">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
