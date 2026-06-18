import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{background: '#FFFBF5'}}>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50" style={{borderColor: '#EDE8E0'}}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-stone-900 font-serif-display">
            Natiive<span style={{color: '#B45309'}}>Matrimony</span>
          </span>
          <div className="flex items-center gap-2">
            <Link href="/browse" className="text-sm font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Browse</Link>
            <Link href="/login" className="text-sm font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50">Login</Link>
            <Link href="/register" className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg" style={{background: '#B45309'}}>Register Free</Link>
          </div>
        </div>
      </header>

      {/* How it works — trust bar */}
      <div className="border-b py-3" style={{background: '#FEF3C7', borderColor: '#FDE68A'}}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center justify-center gap-2 sm:gap-8 text-xs font-semibold" style={{color: '#92400E'}}>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{background: '#B45309'}}>1</span>
              Register Free
            </div>
            <div className="hidden sm:block text-amber-300">→</div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{background: '#B45309'}}>2</span>
              Get Verified
            </div>
            <div className="hidden sm:block text-amber-300">→</div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{background: '#B45309'}}>3</span>
              Find Your Match
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-5 py-16 sm:py-24">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border" style={{background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A'}}>
          ✦ Telugu Families · Native Place First
        </div>

        <h1 className="font-serif-display text-4xl sm:text-6xl font-bold text-stone-900 mb-5 leading-tight">
          Find your match from<br />
          <span style={{color: '#B45309'}}>your native place</span>
        </h1>

        <p className="text-base sm:text-lg text-stone-500 max-w-lg mb-4 leading-relaxed">
          The only Telugu matrimony site that puts your native district front and centre.
          Every profile is manually reviewed — not pay-to-verify.
        </p>

        <p className="text-sm font-semibold mb-10" style={{color: '#B45309'}}>
          1,200+ Telugu families · Growing every week
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link href="/register" className="font-semibold px-8 py-3.5 rounded-xl text-center text-white text-base" style={{background: '#B45309'}}>
            Find Your Native Match →
          </Link>
          <Link href="/browse" className="font-semibold px-8 py-3.5 rounded-xl text-center text-base border-2" style={{borderColor: '#B45309', color: '#B45309'}}>
            Browse Profiles
          </Link>
        </div>

        {/* 3 differentiation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full text-left">
          {[
            {
              icon: '📍',
              title: 'Native-place first',
              desc: 'Filter by Coastal Andhra, Rayalaseema, or Telangana — then drill down to district. Not an afterthought — the main event.',
            },
            {
              icon: '🔒',
              title: 'Photo private until match',
              desc: 'Photos and contact details unlock only after both sides accept each other. Your privacy, always protected.',
            },
            {
              icon: '✓',
              title: 'Hand-verified profiles',
              desc: 'Every profile is manually reviewed by our team. No bots, no pay-to-verify — only genuine Telugu families.',
            },
          ].map(f => (
            <div key={f.title} className="rounded-2xl p-5 border text-left" style={{background: 'white', borderColor: '#EDE8E0'}}>
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <p className="font-bold text-stone-800 mb-1.5 font-serif-display text-base">{f.title}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof strip */}
        <div className="mt-16 flex flex-wrap gap-6 justify-center">
          {['Visakhapatnam', 'Hyderabad', 'Guntur', 'Warangal', 'Kurnool'].map(d => (
            <span key={d} className="text-xs font-semibold px-3 py-1.5 rounded-full border" style={{color: '#92400E', borderColor: '#FDE68A', background: '#FEF3C7'}}>
              {d}
            </span>
          ))}
          <span className="text-xs text-stone-400 self-center">+ 20 more districts</span>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-xs text-stone-400" style={{borderColor: '#EDE8E0'}}>
        © 2025 NatiiveMatrimony · Built for Telugu families · All profiles verified
      </footer>
    </div>
  )
}
