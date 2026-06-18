import Link from 'next/link'
import MapHero from './components/MapHero'

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

      {/* Trust steps */}
      <div className="border-b py-2.5" style={{ background: '#FEF3C7', borderColor: '#FDE68A' }}>
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-center gap-3 sm:gap-8 text-xs font-semibold" style={{ color: '#92400E' }}>
          {['Register Free', 'Get Verified', 'Find Your Match'].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0" style={{ background: '#B45309' }}>{i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
              <span className="sm:hidden">{s.split(' ').pop()}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1">

        {/* Hero */}
        <div className="text-center px-5 pt-14 pb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border" style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}>
            ✦ Telugu Families · Native Place First
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-stone-900 mb-4 leading-tight">
            Find your match from<br />
            <span style={{ color: '#B45309' }}>your native place</span>
          </h1>
          <p className="text-base text-stone-500 max-w-md mx-auto mb-3 leading-relaxed">
            The only Telugu matrimony site that puts your native district first.
            Every profile manually reviewed — not pay-to-verify.
          </p>
          <p className="text-sm font-semibold mb-8" style={{ color: '#B45309' }}>1,200+ Telugu families · Growing every week</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="font-semibold px-8 py-3.5 rounded-xl text-white text-base" style={{ background: '#B45309' }}>
              Find Your Native Match →
            </Link>
            <Link href="/browse" className="font-semibold px-8 py-3.5 rounded-xl text-base border-2" style={{ borderColor: '#B45309', color: '#B45309' }}>
              Browse Profiles
            </Link>
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

      </main>

      <footer className="border-t py-6 text-center text-xs text-stone-400" style={{ borderColor: '#EDE8E0' }}>
        © 2025 NatiiveMatrimony · Built for Telugu families · All profiles verified
      </footer>
    </div>
  )
}
