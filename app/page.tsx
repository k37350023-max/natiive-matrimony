import Link from 'next/link'
import MapHero from './components/MapHero'
import LaunchBanner from './components/LaunchBanner'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF9' }}>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50" style={{ borderColor: '#E8E0D6' }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-stone-900 font-serif-display">
            Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
          </span>
          <div className="flex items-center gap-1">
            <Link href="/browse" className="text-sm font-medium text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Browse</Link>
            <Link href="/login" className="text-sm font-medium text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-50">Login</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-1.5 ml-1">Register Free</Link>
          </div>
        </div>
      </header>

      <LaunchBanner />

      <main className="flex-1">

        {/* Hero */}
        <div className="text-center px-5 pt-14 pb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6" style={{ background: '#FEF9EC', color: '#92400E', border: '1px solid #F0E4C0' }}>
            Telugu families · Native place first
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-stone-900 mb-5 leading-tight tracking-tight">
            Find your match<br />
            <span style={{ color: '#B45309' }}>from your native place</span>
          </h1>
          <p className="text-base text-stone-500 max-w-sm mx-auto mb-8 leading-relaxed">
            Telugu matrimony, built around your native place.
            Browse and connect — completely free during our launch.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/register" className="btn-primary px-7 py-3 text-sm w-full sm:w-auto">
              Create Free Profile
            </Link>
            <Link href="/browse" className="btn-ghost px-7 py-3 text-sm w-full sm:w-auto">
              Browse Profiles
            </Link>
          </div>
        </div>

        {/* Map section — moved above trust bar so it's visible without scrolling on mobile */}
        <div className="py-10 px-5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#B45309' }}>How it works</p>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-stone-900">
                Pick your native place.<br />See who's from there.
              </h2>
            </div>
            <MapHero />
          </div>
        </div>

        {/* Trust bar */}
        <div className="border-y" style={{ borderColor: '#E8E0D6', background: 'white' }}>
          <div className="max-w-3xl mx-auto px-5 py-4 grid grid-cols-3 divide-x divide-stone-200">
            {[
              { n: 'Free', label: 'Until Sept 2026' },
              { n: 'Private', label: 'Photos until match' },
              { n: 'Verified', label: 'Every profile' },
            ].map(({ n, label }) => (
              <div key={n} className="text-center px-4">
                <p className="font-serif-display font-bold text-stone-900 text-lg">{n}</p>
                <p className="text-xs text-stone-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="max-w-4xl mx-auto px-5 pb-16">
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
                title: 'Verified profiles only',
                desc: 'Every profile is reviewed before going live. No bots, no fake entries — genuine Telugu families only.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B45309' }}>Free until September 2026</p>
            <h3 className="font-serif-display text-2xl font-bold text-stone-900 mb-3">
              Your Telugu match is waiting
            </h3>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              Create your profile in under 3 minutes. No credit card. No subscription. Full access to every feature during our launch.
            </p>
            <Link href="/register" className="btn-primary px-8 py-3 text-sm w-full">
              Create Your Free Profile
            </Link>
          </div>
        </div>

      </main>

      <footer className="border-t py-6 text-center text-xs text-stone-400" style={{ borderColor: '#E8E0D6' }}>
        © 2026 NatiiveMatrimony · Built for Telugu families
      </footer>
    </div>
  )
}
