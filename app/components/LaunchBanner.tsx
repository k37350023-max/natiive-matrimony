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
        style={{ background: '#E6FBF5', border: '1px solid #A7F3D0' }}>
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06D6A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div>
            <p className="text-xs font-bold" style={{ color: '#0B132B' }}>Offer Already Applied</p>
            <p className="text-[11px]" style={{ color: '#057A5B' }}>Premium active until {formatted}</p>
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
      className="block mx-4 my-3 rounded-2xl overflow-hidden transition-shadow"
      style={{ background: 'linear-gradient(135deg, #4CC9F0 0%, #4CC9F0 55%, #38B6DD 100%)', boxShadow: '0 4px 16px rgba(76,201,240,0.35)' }}>
      <div className="px-5 py-5 flex items-center gap-5">

        {/* Icon */}
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(28,25,23,0.12)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B132B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm leading-snug" style={{ color: '#0B132B' }}>Founder Member Offer</p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: '#0B132B' }}>
            First 1,000 profiles get<br />1 year free premium
          </p>
          {count !== null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(28,25,23,0.18)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#0B132B' }} />
              </div>
              <span className="text-[10px] font-bold shrink-0" style={{ color: '#0B132B' }}>{remaining.toLocaleString()} left</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="text-xs font-extrabold px-3 py-1.5 rounded-lg"
            style={{ background: '#0B132B', color: '#E0F7FC' }}>
            {isLoggedIn ? 'See pricing' : 'Claim spot'}
          </span>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setDismissed(true); sessionStorage.setItem('banner_dismissed', '1') }}
            className="transition-colors text-xs"
            style={{ color: '#0B132B' }}
            aria-label="Dismiss">
            Dismiss
          </button>
        </div>

      </div>
    </Link>
  )
}
