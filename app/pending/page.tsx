'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PendingPage() {
  useEffect(() => {
    async function saveProfileId() {
      const { data } = await supabase.from('profiles').select('id').order('created_at', { ascending: false }).limit(1).single()
      if (data?.id) localStorage.setItem('my_profile_id', data.id)
    }
    saveProfileId()
  }, [])

  const steps = [
    { title: 'Profile submitted', desc: 'Your profile is in our review queue.', done: true },
    { title: 'Manual verification', desc: 'We review every profile — usually within 24 hours.', done: false },
    { title: 'Go live', desc: 'Once approved, your profile appears in browse results.', done: false },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{background: '#FFF7ED'}}>
      <header style={{background: 'white', borderBottom: '1px solid #E7E5E4'}}>
        <div className="max-w-xl mx-auto px-6 py-4">
          <Link href="/" className="text-base font-bold text-stone-900">
            Natiive<span className="text-orange-700">Matrimony</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Profile Submitted!</h1>
            <p className="text-stone-500 leading-relaxed">
              Thank you. We'll review your profile and send you an email once it's approved.
            </p>
          </div>

          <div className="card p-6 mb-6">
            <p className="section-label mb-4">What happens next</p>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={s.title} className="flex gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${s.done ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {s.done ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">{s.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/browse" className="flex-1 btn-primary text-center py-3">Browse Profiles</Link>
            <Link href="/matches" className="flex-1 btn-outline text-center py-3">My Matches</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
