import Link from 'next/link'
import MapHero from './components/MapHero'
import LaunchBanner from './components/LaunchBanner'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFBF5' }}>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50" style={{ borderColor: '#EDE8E0' }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-stone-900 font-serif-display">
            Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
          </span>
          <div className="flex items-center gap-2">
            <Link href="/browse" className="text-sm font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Browse</Link>
            <Link href="/login" className="text-sm font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50">Login</Link>
            <Link href="/register" className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg" style={{ background: '#B45309' }}>Register Free</Link>
          </div>
        </div>
      </header>

      {/* Launch offer banner */}
      <LaunchBanner />

      <main className="flex-1">

        {/* Hero */}
        <div className="text-center px-5 pt-12 pb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border" style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}>
            ✦ Telugu Families · Native Place First
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-stone-900 mb-4 leading-tight">
            Find your match from<br />
            <span style={{ color: '#B45309' }}>your native place</span>
          </h1>
          <p className="text-base text-stone-500 max-w-md mx-auto mb-3 leading-relaxed">
            The only Telugu matrimony site that puts your native district first.
            Browse, connect, and find your match — completely free during our launch.
          </p>
          <p className="text-sm font-semibold mb-8" style={{ color: '#B45309' }}>1,200+ Telugu families · Growing every week</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="font-semibold px-8 py-3.5 rounded-xl text-white text-base" style={{ background: '#B45309' }}>
              Register Free — No Card Needed →
            </Link>
            <Link href="/browse" className="font-semibold px-8 py-3.5 rounded-xl text-base border-2" style={{ borderColor: '#B45309', color: '#B45309' }}>
              Browse Profiles
            </Link>
          </div>
        </div>

        {/* Free features callout */}
        <div className="px-5 pb-10">
          <div className="max-w-2xl mx-auto rounded-2xl border-2 p-6" style={{ borderColor: '#166534', background: '#F0FDF4' }}>
            <p className="text-center text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#166534' }}>
              Everything FREE until 30 September 2026
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: '💌', label: 'Unlimited Interests' },
                { icon: '📞', label: 'Contact After Match' },
                { icon: '📄', label: 'Biodata PDF Download' },
                { icon: '📍', label: 'Native Place Filter' },
                { icon: '✓', label: 'Verified Badge' },
                { icon: '⭐', label: 'Priority Listing' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="text-base shrink-0">{f.icon}</span>
                  <span className="text-xs font-semibold text-stone-700">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map section */}
        <div className="py-12 px-5" style={{ background: 'white', borderTop: '1px solid #EDE8E0', borderBottom: '1px solid #EDE8E0' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#B45309' }}>How it works</p>
              <h2 className="font-serif-display text-3xl font-bold text-stone-900 leading-snug">
                Click your native place.<br />See who's from there.
              </h2>
            </div>
            <MapHero />
          </div>
        </div>

        {/* 3 differentiators */}
        <div className="max-w-4xl mx-auto px-5 py-14">
          <h2 className="font-serif-display text-2xl font-bold text-stone-900 text-center mb-8">
            Why families choose NatiiveMatrimony
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🔒', title: 'Photo private until match', desc: 'Photos and contact details unlock only after both sides accept. Your privacy is always protected.' },
              { icon: '✓', title: 'Hand-verified profiles', desc: 'Every profile is reviewed by our team. No bots, no pay-to-verify — genuine Telugu families only.' },
              { icon: '💌', title: 'Mutual interest model', desc: 'Both sides must accept before contact is shared. No unsolicited messages, ever.' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-5 border" style={{ background: 'white', borderColor: '#EDE8E0' }}>
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <p className="font-bold text-stone-800 mb-1.5 font-serif-display">{f.title}</p>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="px-5 pb-16">
          <div className="max-w-lg mx-auto text-center rounded-2xl p-8 border" style={{ background: 'white', borderColor: '#EDE8E0' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#B45309' }}>Join Today — It's Free</p>
            <h3 className="font-serif-display text-2xl font-bold text-stone-900 mb-3">
              Your Telugu match is waiting
            </h3>
            <p className="text-sm text-stone-500 mb-6">
              Join hundreds of Telugu families already using NatiiveMatrimony. Free access to all features during our launch.
            </p>
            <Link href="/register" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto">
              Create Your Free Profile →
            </Link>
            <p className="text-xs text-stone-400 mt-3">Takes less than 3 minutes. No credit card needed.</p>
          </div>
        </div>

      </main>

      <footer className="border-t py-6 text-center text-xs text-stone-400" style={{ borderColor: '#EDE8E0' }}>
        © 2026 NatiiveMatrimony · Built for Telugu families · Free until September 2026
      </footer>
    </div>
  )
}
