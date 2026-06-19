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
    if (sessionStorage.getItem('banner_dismissed')) setDismissed(true)
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count }) => setCount(count ?? 0))
  }, [])

  if (dismissed) return null

  const filled = count ?? 0
  const remaining = Math.max(GOAL - filled, 0)
  const pct = Math.min(Math.round((filled / GOAL) * 100), 100)

  return (
    <Link href={isLoggedIn ? '/pricing' : '/register'}
      className="block mx-4 my-3 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
      style={{ background: 'linear-gradient(135deg, #6B1414 0%, #7F1D1D 50%, #9B1C1C 100%)' }}>
      <div className="px-5 py-5 flex items-center gap-5">

        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          🎁
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-snug">Founder Member Offer</p>
          <p className="text-red-200 text-xs mt-0.5 leading-snug">
            First 1,000 profiles get<br />1 year free premium
          </p>
          {count !== null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <div className="h-full rounded-full bg-red-300 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-red-300 shrink-0">{remaining.toLocaleString()} left</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: '#FEF2F2', color: '#6B1414' }}>
            {isLoggedIn ? 'See pricing' : 'Claim spot'}
          </span>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setDismissed(true); sessionStorage.setItem('banner_dismissed', '1') }}
            className="text-red-400 hover:text-white transition-colors text-xs"
            aria-label="Dismiss">
            Dismiss
          </button>
        </div>

      </div>
    </Link>
  )
}
