'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const GOAL = 1000
const PERKS = ['Unlimited interests', 'Full biodata access', 'Direct chat', 'Priority listing']

export default function FounderTracker() {
  const [count, setCount] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('my_profile_id'))
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count }) => setCount(count ?? 0))
  }, [])

  const filled = count ?? 0
  const pct = Math.min(Math.round((filled / GOAL) * 100), 100)
  const remaining = Math.max(GOAL - filled, 0)
  const isFull = filled >= GOAL

  return (
    <div className="mx-4 sm:mx-auto sm:max-w-lg rounded-2xl overflow-hidden border bg-white"
      style={{ borderColor: '#E8EDF3', boxShadow: '0 4px 24px rgba(155,28,28,0.10)' }}>

      {/* Header */}
      <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #0B132B 0%, #0B132B 100%)' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-red-300 mb-1">Founder Member Offer</p>
        <p className="text-white font-bold text-xl leading-snug font-serif-display">
          First 1,000 profiles get<br />
          <span className="text-red-200">1 year free premium</span>
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-end justify-between mb-2">
          <p className="text-sm text-gray-500">
            <span className="text-2xl font-bold text-gray-900 font-serif-display mr-1">
              {count === null ? '…' : filled.toLocaleString()}
            </span>
            / {GOAL.toLocaleString()} joined
          </p>
          <p className="text-sm font-bold" style={{ color: '#0B132B' }}>{pct}% full</p>
        </div>

        <div className="h-2.5 rounded-full overflow-hidden bg-gray-100">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(pct, 2)}%`, background: 'linear-gradient(90deg, #0B132B, #DC2626)' }} />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {isFull
            ? <span>Founder spots are full. <Link href="/pricing" className="font-semibold underline" style={{ color: '#0B132B' }}>See pricing →</Link></span>
            : <>Only <span className="font-semibold text-gray-800">{remaining.toLocaleString()} spots left</span> at this price — after that, ₹499/mo</>
          }
        </p>
      </div>

      {/* Perks */}
      <div className="px-6 py-4 border-t" style={{ borderColor: '#F3F4F6' }}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What you get free for a year</p>
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
          {PERKS.map(perk => (
            <div key={perk} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#EAF8FE' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0B132B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span className="text-sm text-gray-700">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6 pt-2">
        <Link href={isLoggedIn ? '/pricing' : '/register'}
          className="btn-primary w-full py-3 text-sm text-center block rounded-xl font-semibold">
          {isLoggedIn ? 'View your membership →' : 'Claim your free spot →'}
        </Link>
      </div>
    </div>
  )
}
