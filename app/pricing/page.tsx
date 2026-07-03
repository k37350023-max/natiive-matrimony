 'use client'

import Link from 'next/link'
import AppHeader from '../components/AppHeader'

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FBFAF5' }}>
      <AppHeader />
      <main className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-center mb-8">
          <p className="section-label mb-3">NativeMatrimony</p>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Free basics. First 100 days premium. Founding Members get more.
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Create a profile, search native places, and receive requests for free. New members get a 100-day premium boost; first 1,000 profiles per district get 2 years.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <section className="card px-6 py-7">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="section-label mb-2">Launch Access</p>
                <h2 className="font-serif-display text-2xl font-bold text-gray-900">Freemium + premium boost</h2>
              </div>
              <span className="badge badge-approved">100 days free</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              For serious families who need enough time to build a profile, browse by roots, request access, and wait for the right native-place matches.
            </p>
            <div className="space-y-3 mb-6">
              {[
                'Always free: profile creation, basic search, and receiving requests.',
                'First 100 days: premium messaging, contact unlocks after acceptance, and photo access controls.',
                'District Founding Member bonus: first 1,000 profiles per district get 2 years of free premium.',
                'Native-place alerts when matching families join.',
                'Photo visible by default, hide option available.',
                'No random messages before mutual interest.',
              ].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1B5E20' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link href="/register" className="btn-primary text-sm px-5 py-3 w-full justify-center">Start Free</Link>
          </section>

          <section className="card px-6 py-7" style={{ background: 'linear-gradient(145deg, #101828 0%, #14241C 100%)', borderColor: '#2D3C34', color: 'white', boxShadow: '0 24px 60px rgba(20,36,28,0.18)' }}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="section-label mb-2" style={{ color: '#E7C76D' }}>Guided help</p>
                <h2 className="font-serif-display text-2xl font-bold">Human-assisted</h2>
              </div>
              <span style={{ border: '1px solid rgba(231,199,109,0.45)', color: '#E7C76D', borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800 }}>Concierge</span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.72)' }}>
              For families who want a careful coordinator to review profiles, prepare shortlists, and help with introductions.
            </p>
            <div className="space-y-3 mb-6">
              {[
                'Manual profile and intent review.',
                'Curated shortlist based on roots and preferences.',
                'Family-level introduction support.',
                'Priority help for serious families in growing native-place corridors.',
                'Paid plans can start later after a corridor has real activity.',
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
    </div>
  )
}
