import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-stone-100 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-stone-900">Natiive<span className="text-orange-700">Matrimony</span></span>
          <div className="flex items-center gap-2">
            <Link href="/browse" className="text-sm font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Browse</Link>
            <Link href="/login" className="text-sm font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50">Login</Link>
            <Link href="/register" className="text-sm font-semibold bg-orange-700 text-white px-4 py-1.5 rounded-lg hover:bg-orange-800">Register</Link>
          </div>
        </div>
      </header>

      {/* Trust bar */}
      <div className="bg-orange-50 border-b border-orange-100 py-2">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-center gap-6 text-xs font-medium text-orange-800">
          <span>✓ 100% Verified</span>
          <span>✓ Free to Join</span>
          <span>✓ Telugu Families</span>
          <span className="hidden sm:block">✓ Native Place First</span>
        </div>
      </div>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-5 py-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4 leading-tight">
          Find your match from<br className="hidden sm:block" />{' '}
          <span className="text-orange-700">your native place</span>
        </h1>
        <p className="text-base text-stone-500 max-w-md mb-8 leading-relaxed">
          Telugu matrimony focused on native district, state and region. Verified profiles. Private until mutual match.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link href="/register" className="bg-orange-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-orange-800 text-center">Create Profile</Link>
          <Link href="/browse" className="border-2 border-orange-700 text-orange-700 font-semibold px-8 py-3 rounded-xl hover:bg-orange-50 text-center">Browse Profiles</Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl w-full text-left">
          {[
            { title: 'Native-first filters', desc: 'Filter by region → state → district to find matches from your hometown.' },
            { title: 'Manually verified', desc: 'Every profile is reviewed by our team before appearing in results.' },
            { title: 'Private until match', desc: 'Photos and contact details unlock only after both sides accept.' },
          ].map(f => (
            <div key={f.title} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
              <p className="font-semibold text-stone-800 mb-1.5">{f.title}</p>
              <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-stone-100 py-5 text-center text-xs text-stone-400">
        © 2025 NatiiveMatrimony · For Telugu families
      </footer>
    </div>
  )
}
