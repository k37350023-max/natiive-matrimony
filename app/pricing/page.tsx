 'use client'

import Link from 'next/link'
import HomeHeader from '../components/HomeHeader'
import AppFooter from '../components/AppFooter'

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FBFAF5' }}>
      <HomeHeader />
      <main className="max-w-xl mx-auto px-5 py-12">
        <div className="card px-6 py-7">
          <p className="section-label mb-3">NativeMatrimony</p>
          <h1 className="font-serif-display text-2xl font-bold text-gray-900 mb-3">
            Request-based registry access
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            NativeMatrimony does not use premium plans right now. Search by native place,
            send a request, and unlock biodata and contact only after acceptance.
          </p>
          <div className="space-y-3 mb-6">
            {[
              'Search by native place first.',
              'Private until both sides agree.',
              'Biodata and contact unlock only after acceptance.',
            ].map(item => (
              <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1B5E20' }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/browse" className="btn-primary text-sm px-5 py-3">Browse registry</Link>
            <Link href="/register" className="btn-ghost text-sm px-5 py-3">Create profile</Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
