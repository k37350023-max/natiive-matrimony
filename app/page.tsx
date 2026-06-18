import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{background: 'linear-gradient(160deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)'}}>
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div>
          <span className="text-xl font-bold text-stone-900 tracking-tight">Natiive<span className="text-orange-700">Matrimony</span></span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/browse" className="text-sm font-medium text-stone-600 hover:text-orange-700">Browse</Link>
          <Link href="/admin" className="text-sm font-medium text-stone-600 hover:text-orange-700">Admin</Link>
          <Link href="/register" className="btn-primary text-sm px-5 py-2">Register Free</Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
          Telugu matrimony — native place first
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-stone-900 mb-5 leading-tight max-w-2xl">
          Find your match from your <span className="text-orange-700">native place</span>
        </h1>
        <p className="text-lg text-stone-500 max-w-xl mb-10 leading-relaxed">
          Browse verified Telugu profiles filtered by district, region, and native place.
          Mutual interest unlocks full biodata and contact details.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">Create Profile</Link>
          <Link href="/browse" className="btn-outline px-8 py-3 text-base">Browse Profiles</Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {[
            { icon: '📍', title: 'Native-first filters', desc: 'Filter by region, state, and district to find matches from your hometown.' },
            { icon: '✓', title: 'Verified profiles', desc: 'Every profile is manually reviewed before going live on the platform.' },
            { icon: '🔒', title: 'Private until match', desc: 'Contact details and full biodata unlock only after mutual interest.' },
          ].map(f => (
            <div key={f.title} className="card p-5 text-left">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-stone-800 mb-1">{f.title}</div>
              <div className="text-sm text-stone-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-stone-400">
        © 2025 NatiiveMatrimony · Made for Telugu families
      </footer>
    </div>
  )
}
