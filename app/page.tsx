import MapHero from './components/MapHero'
import HomeHeader from './components/HomeHeader'
import HeroCTA from './components/HeroCTA'
import FounderTracker from './components/FounderTracker'
import LaunchBanner from './components/LaunchBanner'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF9' }}>

      <HomeHeader />
      <LaunchBanner />

      <main className="flex-1">

        {/* Hero */}
        <div className="text-center px-5 pt-8 pb-4 sm:pt-16 sm:pb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5" style={{ background: '#FEF9EC', color: '#92400E', border: '1px solid #F0E4C0' }}>
            Telugu families · Native place first
          </div>
          <h1 className="font-serif-display text-3xl sm:text-5xl font-bold text-stone-900 mb-3 sm:mb-5 leading-tight tracking-tight">
            Find your match<br />
            <span style={{ color: '#B45309' }}>from your native place</span>
          </h1>
          <p className="text-sm sm:text-base text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed">
            Telugu matrimony built around where you&apos;re from.
            Join free — first 1,000 members get premium for life.
          </p>
          <HeroCTA />
        </div>

        {/* Founder Member Tracker — hero placement */}
        <div className="pt-2 pb-10 sm:pb-14">
          <FounderTracker />
        </div>

        {/* Map */}
        <div className="px-4 pb-10 sm:py-10 sm:px-5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#B45309' }}>Browse by native place</p>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-stone-900">
                Pick your district.<br />See who&apos;s from there.
              </h2>
            </div>
            <MapHero />
          </div>
        </div>

        {/* Trust bar */}
        <div className="border-y" style={{ borderColor: '#E8E0D6', background: 'white' }}>
          <div className="max-w-3xl mx-auto px-5 py-4 grid grid-cols-3 divide-x divide-stone-200">
            {[
              { n: '1,000', label: 'Free premium spots' },
              { n: 'Private', label: 'Photos until match' },
              { n: 'Telugu', label: 'Families only' },
            ].map(({ n, label }) => (
              <div key={n} className="text-center px-2">
                <p className="font-serif-display font-bold text-stone-900 text-lg">{n}</p>
                <p className="text-xs text-stone-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="max-w-4xl mx-auto px-5 py-12">
          <h2 className="font-serif-display text-2xl font-bold text-stone-900 text-center mb-8">
            Why families choose us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: 'Privacy by design',
                desc: 'Photos and contact details unlock only after both sides accept. Your information is never exposed without consent.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
              },
              {
                title: 'Native place matching',
                desc: 'Filter by region, district, and native village. Find someone who truly understands your roots and traditions.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                ),
              },
              {
                title: 'Mutual interest model',
                desc: 'Both parties must accept before any contact is exchanged. No unsolicited messages, ever.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                ),
              },
            ].map(f => (
              <div key={f.title} className="card p-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: '#FEF9EC' }}>
                  {f.icon}
                </div>
                <p className="font-semibold text-stone-800 mb-2 font-serif-display">{f.title}</p>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="px-5 pb-16">
          <div className="max-w-lg mx-auto text-center card p-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B45309' }}>Limited founding spots remaining</p>
            <h3 className="font-serif-display text-2xl font-bold text-stone-900 mb-3">
              Your Telugu match is waiting
            </h3>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              Join the first 1,000 members and get a full year of premium free.
              No credit card required.
            </p>
            <Link href="/register" className="btn-primary px-8 py-3 text-sm w-full">
              Claim your free spot →
            </Link>
            <p className="text-xs text-stone-400 mt-3">
              After 1,000 members · <Link href="/pricing" className="underline">See pricing</Link>
            </p>
          </div>
        </div>

      </main>

      <footer className="border-t py-6 text-center text-xs text-stone-400" style={{ borderColor: '#E8E0D6' }}>
        © 2026 NatiiveMatrimony · Built for Telugu families ·{' '}
        <Link href="/pricing" className="underline hover:text-stone-600">Pricing</Link>
      </footer>
    </div>
  )
}
