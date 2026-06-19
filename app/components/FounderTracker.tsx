'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const GOAL = 1000

export default function FounderTracker() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count }) => setCount(count ?? 0))
  }, [])

  const filled = count ?? 0
  const pct = Math.min(Math.round((filled / GOAL) * 100), 100)
  const remaining = Math.max(GOAL - filled, 0)
  const isFull = filled >= GOAL

  return (
    <div className="mx-4 sm:mx-auto sm:max-w-lg rounded-2xl overflow-hidden shadow-sm border" style={{ background: 'white', borderColor: '#E8E0D6' }}>
      {/* Header strip */}
      <div className="px-6 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #92400E 0%, #B45309 100%)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎁</span>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-200">Founder Member Offer</span>
        </div>
        <p className="text-white font-serif-display text-xl font-bold leading-tight">
          First {GOAL.toLocaleString()} profiles get<br />
          <span className="text-amber-300">1 year free premium</span>
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-3xl font-bold font-serif-display text-stone-900">
              {count === null ? '…' : filled.toLocaleString()}
            </span>
            <span className="text-stone-400 text-sm ml-1">/ {GOAL.toLocaleString()} joined</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#B45309' }}>{pct}% full</span>
        </div>

        {/* Bar */}
        <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #B45309, #D97706)' }}
          />
        </div>

        {!isFull ? (
          <p className="text-xs text-stone-400 mt-2">
            Only <span className="font-semibold text-stone-700">{remaining.toLocaleString()} spots left</span> at this price — after that, ₹499/mo
          </p>
        ) : (
          <p className="text-xs text-stone-500 mt-2">Founder spots are full. <Link href="/pricing" className="underline" style={{ color: '#B45309' }}>See pricing →</Link></p>
        )}
      </div>

      {/* Perks */}
      <div className="px-6 py-4 border-t mx-2 mb-2" style={{ borderColor: '#F0EDE8' }}>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">What you get free for a year</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['✓', 'Unlimited interests'],
            ['✓', 'Full biodata access'],
            ['✓', 'Direct chat'],
            ['✓', 'Priority listing'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: '#B45309' }}>{icon}</span>
              <span className="text-xs text-stone-600">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-5">
        <Link href="/register" className="btn-primary w-full py-3 text-sm text-center block">
          Claim your free spot →
        </Link>
      </div>
    </div>
  )
}
