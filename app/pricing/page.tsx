'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import HomeHeader from '../components/HomeHeader'

const GOAL = 1000

const FEATURES = [
  'Browse all profiles',
  'Send unlimited interests',
  'Read full biodata',
  'Direct chat after match',
  'Per-field privacy controls',
  'Who viewed your profile',
  'Priority listing in search',
  'Biodata PDF auto-fill',
]

export default function PricingPage() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count }) => setCount(count ?? 0))
  }, [])

  const filled = count ?? 0
  const remaining = Math.max(GOAL - filled, 0)
  const isFull = filled >= GOAL
  const pct = Math.min(Math.round((filled / GOAL) * 100), 100)

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <HomeHeader />

      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">

        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B45309' }}>Simple, honest pricing</p>
          <h1 className="font-serif-display text-3xl font-bold text-stone-900 mb-3">
            Free now. Affordable always.
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            NatiiveMatrimony is completely free for our founding members.
            After the first 1,000 profiles, a small monthly fee keeps the platform running — and the community spam-free.
          </p>
        </div>

        {/* Live tracker */}
        {!isFull ? (
          <div className="rounded-2xl border mb-8 overflow-hidden" style={{ borderColor: '#E8E0D6', background: 'white' }}>
            <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #92400E, #B45309)' }}>
              <p className="text-amber-200 text-xs font-bold uppercase tracking-widest mb-1">Founder offer — still open</p>
              <p className="text-white font-serif-display text-lg font-bold">
                {count === null ? '…' : remaining.toLocaleString()} spots left for free 1-year premium
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                <span>{filled.toLocaleString()} joined</span>
                <span>{pct}% of {GOAL.toLocaleString()}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #B45309, #D97706)' }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border mb-8 px-6 py-4 text-center" style={{ borderColor: '#E8E0D6', background: '#FEF9EC' }}>
            <p className="text-sm font-semibold text-stone-700">Founder spots are now full. Premium subscription below applies.</p>
          </div>
        )}

        {/* Plans side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">

          {/* Founder — free */}
          <div className="rounded-2xl border-2 p-6 relative" style={{ borderColor: '#B45309', background: 'white' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: '#B45309' }}>
                {isFull ? 'Closed' : 'Open now'}
              </span>
            </div>
            <p className="font-serif-display font-bold text-stone-900 text-lg mb-1">Founder Member</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold font-serif-display text-stone-900">₹0</span>
              <span className="text-stone-400 text-sm mb-1">/ year</span>
            </div>
            <p className="text-xs text-stone-500 mb-5">First 1,000 profiles only</p>
            <ul className="space-y-2 mb-6">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="font-bold mt-0.5" style={{ color: '#B45309' }}>✓</span>
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm font-semibold" style={{ color: '#B45309' }}>
                <span className="mt-0.5">★</span>
                Founder badge on profile
              </li>
            </ul>
            {!isFull ? (
              <Link href="/register" className="btn-primary w-full py-3 text-sm text-center block">
                Claim free spot →
              </Link>
            ) : (
              <button disabled className="w-full py-3 text-sm rounded-xl text-stone-400 cursor-not-allowed" style={{ background: '#F0EDE8' }}>
                All spots taken
              </button>
            )}
          </div>

          {/* Premium — paid */}
          <div className="rounded-2xl border p-6" style={{ borderColor: '#E8E0D6', background: 'white' }}>
            <p className="font-serif-display font-bold text-stone-900 text-lg mb-1">Premium</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold font-serif-display text-stone-900">$5</span>
              <span className="text-stone-400 text-sm mb-1">/ month</span>
            </div>
            <p className="text-xs text-stone-500 mb-5">
              {isFull ? 'Available now' : `Available after ${GOAL.toLocaleString()} members`}
            </p>
            <ul className="space-y-2 mb-6">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="font-bold mt-0.5 text-stone-400">✓</span>
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm text-stone-400">
                <span className="mt-0.5">—</span>
                No founder badge
              </li>
            </ul>
            {isFull ? (
              <Link href="/register" className="btn-primary w-full py-3 text-sm text-center block">
                Get started →
              </Link>
            ) : (
              <div className="w-full py-3 text-sm text-center rounded-xl font-medium text-stone-400" style={{ background: '#F0EDE8' }}>
                Available after {GOAL.toLocaleString()} members
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border p-6" style={{ borderColor: '#E8E0D6', background: 'white' }}>
          <h2 className="font-serif-display font-bold text-stone-900 mb-5">Common questions</h2>
          <div className="space-y-5">
            {[
              {
                q: 'When does the free period end?',
                a: 'Founder members get exactly 1 year free from the date they join. After that, the $5/month plan applies — or you can leave, no hard feelings.',
              },
              {
                q: 'What happens when 1,000 profiles are reached?',
                a: 'The free founder spots close immediately. New signups can still join and browse free, but full features require the $5/month plan.',
              },
              {
                q: 'Is there a free tier after 1,000 members?',
                a: 'Yes — you can always create a profile and browse. Full features (unlimited interests, chat, biodata access) require premium.',
              },
              {
                q: 'Why $5/month and not more?',
                a: 'We want the platform accessible to everyone. A small fee keeps bots and fake profiles out, and keeps the lights on.',
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="text-sm font-semibold text-stone-800 mb-1">{q}</p>
                <p className="text-sm text-stone-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
