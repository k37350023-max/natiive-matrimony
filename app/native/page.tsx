import { Metadata } from 'next'
import Link from 'next/link'
import BrandLogo from '../components/BrandLogo'
import { INDIA_STATES, slugify } from '@/lib/nativePlaces'

export const revalidate = 86400
const BASE = 'https://nativematrimony.com'

export const metadata: Metadata = {
  title: 'Browse Matrimony by Native Place — All Districts',
  description: 'Find marriage profiles by native place across India. Browse brides and grooms by hometown district — Andhra Pradesh, Telangana, Karnataka, Tamil Nadu and more. Free to start.',
  alternates: { canonical: `${BASE}/native` },
  openGraph: { title: 'Browse Matrimony by Native Place', description: 'Marriage profiles organised by native place across India.', url: `${BASE}/native`, type: 'website', locale: 'en_IN' },
}

const EXCLUDED = new Set(['Other / Abroad'])

export default function NativeDirectory() {
  const states = Object.entries(INDIA_STATES).filter(([s]) => !EXCLUDED.has(s))

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF5' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #E7E3D8' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandLogo className="app-brand-compact" showTagline={false} />
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: '#5E6B62' }}>Login</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-1.5" style={{ textDecoration: 'none' }}>Join Free</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '0 16px 64px' }}>
        <section className="text-center" style={{ padding: '40px 0 24px' }}>
          <p className="text-xs font-bold tracking-wide uppercase" style={{ color: '#1B5E20', letterSpacing: '0.08em' }}>By native place</p>
          <h1 className="font-bold" style={{ fontSize: 30, lineHeight: 1.15, color: '#14241C', margin: '10px 0 0' }}>
            Browse matrimony by native place
          </h1>
          <p className="mx-auto mt-3" style={{ fontSize: 15, lineHeight: 1.6, color: '#4B5A50', maxWidth: 460 }}>
            Pick your hometown district to see profiles with the same roots — or set a free alert
            and we&apos;ll notify you when a matching family joins.
          </p>
        </section>

        {states.map(([state, districts]) => (
          <section key={state} className="mb-7">
            <h2 className="text-sm font-bold mb-2.5" style={{ color: '#14241C' }}>{state}</h2>
            <div className="flex flex-wrap gap-2">
              {districts.map(d => (
                <Link key={d} href={`/native/${slugify(d)}`}
                  className="text-[13px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'white', border: '1px solid #E0E8DD', color: '#3B4A40', textDecoration: 'none' }}>
                  {d}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
