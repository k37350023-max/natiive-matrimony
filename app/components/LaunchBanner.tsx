'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const GOAL = 1000

export default function LaunchBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [premiumExpiry, setPremiumExpiry] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    setIsLoggedIn(!!id)
    if (sessionStorage.getItem('banner_dismissed')) setDismissed(true)
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count }) => setCount(count ?? 0))
    if (id) {
      supabase.from('profiles').select('premium_expires_at').eq('id', id).maybeSingle()
        .then(({ data }) => {
          if (data?.premium_expires_at && new Date(data.premium_expires_at) > new Date()) {
            setIsPremium(true)
            setPremiumExpiry(data.premium_expires_at)
          }
        })
    }
  }, [])

  if (dismissed) return null

  // Show "Offer Already Applied" minimized banner for premium users
  if (isPremium && premiumExpiry) {
    const expiry = new Date(premiumExpiry)
    const formatted = expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    return (
      <div className="mx-4 my-3 rounded-xl px-4 py-2.5 flex items-center justify-between"
        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-base">✅</span>
          <div>
            <p className="text-xs font-semibold text-green-800">Offer Already Applied</p>
            <p className="text-[11px] text-green-600">Premium active until {formatted}</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-green-400 hover:text-green-600 transition-colors ml-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    )
  }

  const filled = count ?? 0
  const remaining = Math.max(GOAL - filled, 0)
  const pct = Math.min(Math.round((filled / GOAL) * 100), 100)

  return (
    <Link href={isLoggedIn ? '/pricing' : '/register'}
      className="block mx-4 my-3 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
      style={{ background: 'linear-gradient(135deg, #6B1414 0%, #7F1D1D 50%, #9B1C1C 100%)' }}>
      <div className="px-5 py-5 flex items-center gap-5">

        {/* Icon */}
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
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
