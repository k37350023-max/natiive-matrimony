'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import HomeHeader from '../components/HomeHeader'
import AppFooter from '../components/AppFooter'

const GOAL = 1000

const TIERS = [
  {
    name: 'Basic',
    price: '₹0',
    period: 'forever',
    subtitle: 'Browse & discover',
    highlight: false,
    features: [
      { text: 'Browse approved profiles', included: true },
      { text: 'Receive interest requests', included: true },
      { text: 'Basic profile (no photo privacy)', included: true },
      { text: 'Send interests', included: false },
      { text: 'Direct chat', included: false },
      { text: 'Full biodata access', included: false },
      { text: 'Who viewed your profile', included: false },
      { text: 'Priority listing in search', included: false },
    ],
    cta: 'Create free account',
    ctaHref: '/register',
    ctaStyle: 'ghost' as const,
  },
  {
    name: 'Premium',
    price: '₹999',
    period: 'per month',
    subtitle: 'Everything, unlimited',
    highlight: false,
    features: [
      { text: 'Browse approved profiles', included: true },
      { text: 'Receive interest requests', included: true },
      { text: 'Per-field privacy controls', included: true },
      { text: 'Send unlimited interests', included: true },
      { text: 'Direct chat after match', included: true },
      { text: 'Full biodata & contact access', included: true },
      { text: 'Who viewed your profile', included: true },
      { text: 'Priority listing in search', included: true },
    ],
    cta: 'Coming soon',
    ctaHref: null,
    ctaStyle: 'disabled' as const,
  },
  {
    name: 'Founder',
    price: '₹0',
    period: '/ 1 year',
    subtitle: 'First 1,000 members only',
    highlight: true,
    features: [
      { text: 'Browse approved profiles', included: true },
      { text: 'Receive interest requests', included: true },
      { text: 'Per-field privacy controls', included: true },
      { text: 'Send unlimited interests', included: true },
      { text: 'Direct chat after match', included: true },
      { text: 'Full biodata & contact access', included: true },
      { text: 'Who viewed your profile', included: true },
      { text: 'Founder badge on profile ★', included: true },
    ],
    cta: 'Claim your spot →',
    ctaHref: '/register',
    ctaStyle: 'primary' as const,
  },
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
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <HomeHeader />

      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">

        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#0B132B' }}>Simple, honest pricing</p>
          <h1 className="font-serif-display text-3xl font-bold text-gray-900 mb-3">
            Free now. Affordable always.
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            NativeMatrimony is completely free for our founding members.
            After the first 1,000 profiles, a small monthly fee keeps the platform running — and the community spam-free.
          </p>
        </div>

        {/* Live tracker */}
        {!isFull ? (
          <div className="rounded-2xl border mb-8 overflow-hidden" style={{ borderColor: '#E8EDF3', background: 'white' }}>
            <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #0B132B, #0B132B)' }}>
              <p className="text-red-200 text-xs font-bold uppercase tracking-widest mb-1">Founder offer — still open</p>
              <p className="text-white font-serif-display text-lg font-bold">
                {count === null ? '…' : remaining.toLocaleString()} spots left for free 1-year premium
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>{filled.toLocaleString()} joined</span>
                <span>{pct}% of {GOAL.toLocaleString()}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#E8EDF3' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0B132B, #D97706)' }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border mb-8 px-6 py-4 text-center" style={{ borderColor: '#E8EDF3', background: '#EAF8FE' }}>
            <p className="text-sm font-semibold text-gray-700">Founder spots are now full. Premium subscription below applies.</p>
          </div>
        )}

        {/* 3-tier comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {TIERS.map(tier => {
            const isFounder = tier.name === 'Founder'
            const disabled = isFounder && isFull
            return (
              <div key={tier.name}
                className="rounded-2xl p-6 relative flex flex-col"
                style={{
                  border: tier.highlight ? '2px solid #0B132B' : '1px solid #E8EDF3',
                  background: 'white',
                  boxShadow: tier.highlight ? '0 8px 32px rgba(11,19,43,0.12)' : 'none',
                }}>
                {tier.highlight && !isFull && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: '#0B132B' }}>
                      {remaining.toLocaleString()} spots left
                    </span>
                  </div>
                )}
                {disabled && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white bg-gray-400">Closed</span>
                  </div>
                )}
                <p className="font-serif-display font-bold text-gray-900 text-lg mb-0.5">{tier.name}</p>
                <p className="text-xs text-gray-400 mb-3">{tier.subtitle}</p>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-bold font-serif-display text-gray-900">{tier.price}</span>
                  <span className="text-gray-400 text-xs mb-1">{tier.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map(f => (
                    <li key={f.text} className="flex items-start gap-2 text-xs"
                      style={{ color: f.included ? '#334155' : '#D1D5DB' }}>
                      <span className="mt-0.5 font-bold shrink-0" style={{ color: f.included ? '#0B132B' : '#D1D5DB' }}>
                        {f.included ? '✓' : '—'}
                      </span>
                      {f.text}
                    </li>
                  ))}
                </ul>
                {tier.ctaStyle === 'primary' && !disabled && tier.ctaHref ? (
                  <Link href={tier.ctaHref} className="btn-primary w-full py-3 text-sm text-center block">{tier.cta}</Link>
                ) : tier.ctaStyle === 'ghost' && tier.ctaHref ? (
                  <Link href={tier.ctaHref} className="btn-ghost w-full py-3 text-sm text-center block">{tier.cta}</Link>
                ) : (
                  <div className="w-full py-3 text-sm text-center rounded-xl font-medium text-gray-400 cursor-not-allowed" style={{ background: '#E8EDF3' }}>
                    {disabled ? 'All spots taken' : tier.cta}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border p-6" style={{ borderColor: '#E8EDF3', background: 'white' }}>
          <h2 className="font-serif-display font-bold text-gray-900 mb-5">Common questions</h2>
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
                <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      <AppFooter />
    </div>
  )
}
