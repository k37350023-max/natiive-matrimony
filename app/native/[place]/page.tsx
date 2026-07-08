import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import BrandLogo from '../../components/BrandLogo'
import ShareButtons from '../../components/ShareButtons'
import { findPlaceBySlug, allNativePlaces, slugify } from '@/lib/nativePlaces'

// Statically render + refresh hourly (fast, SEO-friendly, cheap).
export const revalidate = 3600
const BASE = 'https://nativematrimony.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

function getAge(dob: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob); if (isNaN(d.getTime())) return null
  const t = new Date()
  let a = t.getFullYear() - d.getFullYear()
  if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--
  return a >= 18 && a <= 90 ? a : null
}

async function loadPlace(name: string) {
  const { count } = await supabase.from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved').ilike('native_district', name)
  const { data: preview } = await supabase.from('profiles')
    .select('id, full_name, gender, date_of_birth, profession, current_city')
    .eq('status', 'approved').ilike('native_district', name)
    .order('created_at', { ascending: false }).limit(6)
  return { count: count ?? 0, preview: preview ?? [] }
}

export async function generateMetadata({ params }: { params: Promise<{ place: string }> }): Promise<Metadata> {
  const { place: slug } = await params
  const place = findPlaceBySlug(slug)
  if (!place) return { title: 'Native place not found' }
  const title = `${place.name} Matrimony — Brides & Grooms by Native Place`
  const description = `Find marriage profiles with native roots in ${place.name}, ${place.state}. Search by native place, set a free alert, and get notified when a matching ${place.name} profile joins. Free to start.`
  const url = `${BASE}/native/${place.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${place.name} Matrimony | NativeMatrimony`, description, url, type: 'website', locale: 'en_IN' },
    twitter: { card: 'summary', title: `${place.name} Matrimony`, description },
    keywords: [`${place.name} matrimony`, `${place.name} brides`, `${place.name} grooms`, `${place.name} marriage`, `${place.state} matrimony`, 'native place matrimony'],
  }
}

export default async function NativePlacePage({ params }: { params: Promise<{ place: string }> }) {
  const { place: slug } = await params
  const place = findPlaceBySlug(slug)
  if (!place) notFound()

  const { count, preview } = await loadPlace(place.name)
  const nearby = allNativePlaces().filter(p => p.state === place.state && p.slug !== place.slug).slice(0, 12)
  const registerHref = `/register?native_place=${encodeURIComponent(place.name)}`
  const browseHref = `/browse?native_place=${encodeURIComponent(place.name)}`
  const shareUrl = `${BASE}/native/${place.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${place.name} Matrimony`,
    description: `Marriage profiles with native roots in ${place.name}, ${place.state}.`,
    url: shareUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
        { '@type': 'ListItem', position: 2, name: `${place.name} Matrimony`, item: shareUrl },
      ],
    },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF5' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E7E3D8' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandLogo className="app-brand-compact" showTagline={false} />
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: '#5E6B62' }}>Login</Link>
            <Link href={registerHref} className="btn-primary text-sm px-4 py-1.5" style={{ textDecoration: 'none' }}>Join Free</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 64px' }}>
        {/* Hero */}
        <section className="text-center" style={{ padding: '40px 0 8px' }}>
          <p className="text-xs font-bold tracking-wide uppercase" style={{ color: '#1B5E20', letterSpacing: '0.08em' }}>
            {place.state} · Native place
          </p>
          <h1 className="font-bold" style={{ fontSize: 32, lineHeight: 1.15, color: '#14241C', margin: '10px 0 0' }}>
            {place.name} Matrimony
          </h1>
          <p className="mx-auto mt-3" style={{ fontSize: 15.5, lineHeight: 1.6, color: '#4B5A50', maxWidth: 460 }}>
            Marriage profiles with native roots in {place.name}. Search by native place,
            set a free alert, and let matching families find you.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-6">
            <Link href={registerHref} className="btn-primary" style={{ minHeight: 48, padding: '0 22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontWeight: 700 }}>
              Create Free Profile
            </Link>
            <Link href={browseHref} className="nm-outline" style={{ minHeight: 48, padding: '0 22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Browse {place.name} profiles
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-5 text-xs" style={{ color: '#6B7A70' }}>
            <span>✓ Free to start</span><span>✓ Native-place first</span><span>✓ Place alerts</span>
          </div>
        </section>

        {/* Count / social proof */}
        <section className="card mt-6 p-5 text-center">
          {count > 0 ? (
            <p style={{ fontSize: 15, color: '#14241C' }}>
              <strong style={{ fontSize: 22 }}>{count.toLocaleString()}</strong>{' '}
              {count === 1 ? 'profile has' : 'profiles have'} native roots in <strong>{place.name}</strong>.
            </p>
          ) : (
            <p style={{ fontSize: 15, color: '#14241C' }}>
              Be among the first from <strong>{place.name}</strong>. Create your profile and set an alert —
              we&apos;ll notify you the moment a matching family joins.
            </p>
          )}
        </section>

        {/* Preview or empty-alert framing */}
        {preview.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-sm font-bold mb-3" style={{ color: '#14241C' }}>Recent profiles from {place.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {preview.map(p => {
                const first = (p.full_name || 'Member').trim().split(' ')[0]
                const age = getAge(p.date_of_birth)
                return (
                  <Link key={p.id} href={browseHref} className="card p-4 text-center" style={{ textDecoration: 'none' }}>
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold" style={{ background: '#EDF3ED', color: '#1B5E20' }}>
                      {first[0]?.toUpperCase()}
                    </div>
                    <p className="mt-2 font-bold text-sm truncate" style={{ color: '#14241C' }}>
                      {first}{age ? `, ${age}` : ''}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#6B7A70' }}>{p.profession || 'Profile'}</p>
                  </Link>
                )
              })}
            </div>
            <p className="text-center mt-3 text-xs" style={{ color: '#8A968E' }}>
              Contact and photos open only after a mutual accept. <Link href={browseHref} style={{ color: '#1B5E20', fontWeight: 700 }}>See all →</Link>
            </p>
          </section>
        ) : (
          <section className="card mt-6 overflow-hidden">
            <div className="p-6 text-center" style={{ background: 'linear-gradient(180deg,#F4F8F2,#FFFFFF)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#14241C' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EAF3EA" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <h2 className="font-bold text-lg" style={{ color: '#14241C' }}>No {place.name} profiles yet?</h2>
              <p className="text-sm mt-1.5 mx-auto" style={{ color: '#4B5A50', maxWidth: 360 }}>
                Create your free profile and set an alert. When a matching family from {place.name} joins, we&apos;ll notify you.
              </p>
              <Link href={registerHref} className="btn-primary inline-flex items-center mt-4" style={{ minHeight: 46, padding: '0 22px', textDecoration: 'none', fontWeight: 700 }}>
                Create Free Profile
              </Link>
            </div>
          </section>
        )}

        {/* Share — WhatsApp virality */}
        <section className="card mt-6 p-5 text-center">
          <p className="font-bold text-sm" style={{ color: '#14241C' }}>Know a family looking in {place.name}?</p>
          <p className="text-xs mt-1 mb-4" style={{ color: '#6B7A70' }}>Share this page — it takes 30 seconds to create a profile.</p>
          <ShareButtons url={shareUrl} text={`${place.name} marriage profiles on NativeMatrimony —`} />
        </section>

        {/* Nearby native places — internal linking for SEO */}
        {nearby.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-bold mb-3" style={{ color: '#14241C' }}>More native places in {place.state}</h2>
            <div className="flex flex-wrap gap-2">
              {nearby.map(n => (
                <Link key={n.slug} href={`/native/${n.slug}`} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'white', border: '1px solid #E0E8DD', color: '#3B4A40', textDecoration: 'none' }}>
                  {n.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
