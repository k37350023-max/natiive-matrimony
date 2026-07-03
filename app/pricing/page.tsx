'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppHeader from '../components/AppHeader'

const check = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function Benefit({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 text-sm" style={{ color: dark ? 'rgba(255,255,255,0.84)' : '#334155' }}>
      <span className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: dark ? '#D9F2C7' : '#EAF3EA', color: '#075E3E' }}>
        {check}
      </span>
      <span>{children}</span>
    </div>
  )
}

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem('my_profile_id')))
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#FBFAF5' }}>
      <AppHeader />
      <main className="max-w-6xl mx-auto px-5 py-10 sm:py-14">
        <div className="max-w-3xl mb-8 sm:mb-10">
          <p className="section-label mb-3">Simple pricing</p>
          <h1 className="font-serif-display text-3xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Start free. Upgrade only when you need more access.
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">
            The free version stays free. Founding members get premium free for 2 years. Everyone else gets 3 months of premium free after signup.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <section className="card px-6 py-7">
            <p className="section-label mb-3">Free</p>
            <h2 className="font-serif-display text-2xl font-bold text-gray-900 mb-2">Always free</h2>
            <p className="text-sm text-gray-500 mb-5">For families who want to try real matches without paying first.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">₹0</span>
              <span className="text-sm text-gray-500 ml-1"> forever</span>
            </div>
            <div className="space-y-3 mb-7">
              <Benefit>Create and edit your profile</Benefit>
              <Benefit>Browse native-place profiles</Benefit>
              <Benefit>Receive match requests</Benefit>
              <Benefit>View biodata and chat for up to 5 accepted profiles per month</Benefit>
              <Benefit>Save places and get alerts</Benefit>
            </div>
            <Link href={isLoggedIn ? '/browse' : '/register?plan=free'} className="btn-ghost text-sm px-5 py-3 w-full justify-center">
              {isLoggedIn ? 'Browse Profiles' : 'Start Free'}
            </Link>
          </section>

          <section className="card px-6 py-7 relative" style={{ borderColor: '#7FB17F', boxShadow: '0 22px 54px rgba(20,36,28,0.14)' }}>
            <span className="absolute right-5 top-5 badge badge-approved">Most useful</span>
            <p className="section-label mb-3">Premium</p>
            <h2 className="font-serif-display text-2xl font-bold text-gray-900 mb-2">Free trial included</h2>
            <p className="text-sm text-gray-500 mb-5">For families who want more conversations and profile access while actively shortlisting.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">Free</span>
              <span className="text-sm text-gray-500 ml-1"> for launch users</span>
            </div>
            <div className="space-y-3 mb-7">
              <Benefit>2 years free for district founding members</Benefit>
              <Benefit>3 months free for everyone else</Benefit>
              <Benefit>More accepted-profile biodata views and chats</Benefit>
              <Benefit>Unlock contact after both sides accept</Benefit>
              <Benefit>Photo controls: show or hide anytime</Benefit>
            </div>
            <Link href={isLoggedIn ? '/browse' : '/register?offer=premium_trial'} className="btn-primary text-sm px-5 py-3 w-full justify-center">
              {isLoggedIn ? 'Use Premium Access' : 'Claim Premium Trial'}
            </Link>
          </section>

          <section className="card px-6 py-7" style={{ background: '#14241C', borderColor: '#203A2C', color: 'white', boxShadow: '0 24px 60px rgba(20,36,28,0.20)' }}>
            <p className="section-label mb-3" style={{ color: '#D9F2C7' }}>Guided help</p>
            <h2 className="font-serif-display text-2xl font-bold mb-2">Human assisted</h2>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.68)' }}>For families who want help reviewing profiles and making serious introductions.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">Custom</span>
              <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.62)' }}> optional</span>
            </div>
            <div className="space-y-3 mb-7">
              <Benefit dark>Profile and intent review</Benefit>
              <Benefit dark>Native-place shortlist support</Benefit>
              <Benefit dark>Family introduction coordination</Benefit>
              <Benefit dark>Priority support for serious searches</Benefit>
            </div>
            <Link href="/consultants" className="text-sm px-5 py-3 w-full justify-center inline-flex rounded-xl font-bold"
              style={{ background: '#D9F2C7', color: '#14241C', textDecoration: 'none' }}>
              Explore Guided Help
            </Link>
          </section>
        </div>

        <section className="mt-8 grid sm:grid-cols-3 gap-3">
          {[
            ['Private by default', 'Full biodata and contact details unlock only after an accepted request.'],
            ['Native-place first', 'Search by hometown, district, city, or diaspora corridor.'],
            ['No random messages', 'Chat opens only after both families show mutual interest.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-xl border bg-white px-5 py-4" style={{ borderColor: '#E7E3D8' }}>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
