 'use client'

import Link from 'next/link'
import AppHeader from '../components/AppHeader'
import AppFooter from '../components/AppFooter'

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FBFAF5' }}>
      <AppHeader />
      <main className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-center mb-8">
          <p className="section-label mb-3">NativePelli</p>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Free Telugu registry. Optional guided introductions.
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Start free with native-place search, requests, and private contact unlocks. Families who want extra trust can use Select for human-assisted shortlisting and introductions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <section className="card px-6 py-7">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="section-label mb-2">Registry</p>
                <h2 className="font-serif-display text-2xl font-bold text-gray-900">Free</h2>
              </div>
              <span className="badge badge-approved">Launch access</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              For families who want to create a verified profile, browse by roots, and send requests at their own pace.
            </p>
            <div className="space-y-3 mb-6">
              {[
                'Search Telugu native places first.',
                'Photo visible by default, hide option available.',
                'Biodata and contact unlock after acceptance.',
                'No random messages before mutual interest.',
              ].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1B5E20' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link href="/register" className="btn-primary text-sm px-5 py-3 w-full justify-center">Create free profile</Link>
          </section>

          <section className="card px-6 py-7" style={{ background: 'linear-gradient(145deg, #101828 0%, #14241C 100%)', borderColor: '#2D3C34', color: 'white', boxShadow: '0 24px 60px rgba(20,36,28,0.18)' }}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="section-label mb-2" style={{ color: '#E7C76D' }}>Select</p>
                <h2 className="font-serif-display text-2xl font-bold">Human-assisted</h2>
              </div>
              <span style={{ border: '1px solid rgba(231,199,109,0.45)', color: '#E7C76D', borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800 }}>Concierge</span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.72)' }}>
              For families who want a trusted coordinator to review profiles, prepare shortlists, and help with introductions.
            </p>
            <div className="space-y-3 mb-6">
              {[
                'Manual profile and intent review.',
                'Curated shortlist based on roots and preferences.',
                'Family-level introduction support.',
                'Priority help for serious Telugu diaspora families.',
              ].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.84)' }}>
                  <span className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#E7C76D', color: '#14241C' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link href="/consultants" className="text-sm px-5 py-3 w-full justify-center inline-flex rounded-xl font-bold text-decoration-none" style={{ background: '#E7C76D', color: '#14241C', textDecoration: 'none' }}>
              Explore guided help
            </Link>
          </section>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
