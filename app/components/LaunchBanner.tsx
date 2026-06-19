'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const GOAL = 1000

export default function LaunchBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('my_profile_id'))
    const bannerDismissed = sessionStorage.getItem('banner_dismissed')
    if (bannerDismissed) setDismissed(true)

    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count }) => setCount(count ?? 0))
  }, [])

  if (dismissed) return null

  const filled = count ?? 0
  const remaining = Math.max(GOAL - filled, 0)
  const pct = Math.min(Math.round((filled / GOAL) * 100), 100)

  return (
    <Link
      href="/pricing"
      className="block border-b px-4 py-2.5 hover:brightness-95 transition-all"
      style={{ background: 'linear-gradient(90deg, #92400E 0%, #B45309 60%, #D97706 100%)', borderColor: '#92400E' }}>
      <div className="max-w-5xl mx-auto flex items-center gap-3">

        {/* Left: label */}
        <span className="text-xs font-bold text-amber-200 shrink-0 hidden sm:block">🎁 Founder Offer</span>
        <span className="text-amber-500 text-xs shrink-0 hidden sm:block">·</span>

        {/* Middle: text + mini progress bar */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="text-xs text-white font-medium truncate">
            {count === null
              ? 'First 1,000 members get 1 year free premium'
              : remaining > 0
                ? `Only ${remaining.toLocaleString()} founder spots left — join free, get 1 year premium`
                : 'Founder spots full — see current pricing'}
          </span>

          {/* Mini progress bar */}
          {count !== null && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <div className="w-20 h-1.5 rounded-full overflow-hidden bg-amber-900">
                <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-amber-300 text-[10px] font-semibold">{filled}/{GOAL}</span>
            </div>
          )}
        </div>

        {/* Right: CTA + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {!isLoggedIn && (
            <span className="text-xs font-bold px-3 py-1 rounded-md text-amber-900"
              style={{ background: '#FEF9EC' }}>
              Claim spot →
            </span>
          )}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setDismissed(true); sessionStorage.setItem('banner_dismissed', '1') }}
            className="text-amber-300 hover:text-white transition-colors p-1"
            aria-label="Dismiss">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

      </div>
    </Link>
  )
}
