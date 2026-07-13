import Link from 'next/link'
import { slugify, allNativePlaces } from '@/lib/nativePlaces'
import { createClient } from '@supabase/supabase-js'
import HomeMotion from './components/HomeMotion'

export const revalidate = 600

const popularPlaces = ['Hyderabad', 'Guntur', 'Warangal', 'Nellore', 'Vijayawada', 'Karimnagar']
const FEATURED = ['Guntur', 'Karimnagar', 'Warangal']

const steps: Array<[string, string, string]> = [
  ['Choose your native place', 'Search and select your hometown.', 'pin'],
  ['Create your free profile', 'Takes less than 30 seconds.', 'card'],
  ['Get match alerts', "We'll notify you when matching families join.", 'bell'],
]

const trust: Array<[string, string, string]> = [
  ['Native Place Search', 'Find matches from your hometown first.', 'pin'],
  ['Mutual Interest Only', 'Connect only when both families are interested.', 'heart'],
  ['Private Photos', 'Photos are private until mutual acceptance.', 'lock'],
  ['Parent Friendly', 'Parents can create and manage profiles easily.', 'family'],
  ['Phone Verified Profiles', 'Every profile is phone verified for your safety.', 'shield'],
  ['Instant Match Alerts', 'Real-time alerts when matches from your place join.', 'bell'],
]

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: 'NativeMatrimony', url: 'https://nativematrimony.com', description: 'Native-place-first matrimony. Search by native place, create a free profile, and connect only on mutual interest.' },
    { '@type': 'WebSite', name: 'NativeMatrimony', url: 'https://nativematrimony.com', potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://nativematrimony.com/browse?native_place={search_term_string}' }, 'query-input': 'required name=search_term_string' } },
  ],
}

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    card: 'M7 4h7l4 4v12H7z M13 4v5h5 M9 13h6 M9 16h4',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
    lock: 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v10H5z',
    family: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87',
    people: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    search: 'm21 21-4.35-4.35 M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
    check: 'M20 6 9 17l-5-5',
    temple: 'M12 2 4 7h16z M6 7v11 M18 7v11 M10 7v11 M14 7v11 M4 18h16 M3 21h18',
    crown: 'M2 18h20 M4 18l-2-9 5 4 5-8 5 8 5-4-2 9',
    chevron: 'M9 6l6 6-6 6',
    arrow: 'M5 12h14 M13 5l7 7-7 7',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.check} />
    </svg>
  )
}

async function getData() {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString()
    const queries: PromiseLike<{ count: number | null }>[] = [
      sb.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    ]
    FEATURED.forEach(p => {
      queries.push(sb.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved').ilike('native_district', p))
      queries.push(sb.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved').ilike('native_district', p).gte('created_at', monthAgo))
    })
    const res = await Promise.all(queries)
    const total = res[0].count ?? 0
    const places = FEATURED.map((name, i) => ({
      name,
      profiles: res[1 + i * 2].count ?? 0,
      month: res[2 + i * 2].count ?? 0,
    }))
    return { total, places }
  } catch {
    return { total: 0, places: FEATURED.map(name => ({ name, profiles: 0, month: 0 })) }
  }
}

export default async function Home() {
  const { total, places } = await getData()
  const nativePlaceCount = allNativePlaces().length
  const stats: Array<[number, string, string, string]> = [
    [total, '+', 'Families joined', 'people'],
    [nativePlaceCount, '+', 'Native places', 'pin'],
    [100, '%', 'Phone verified', 'shield'],
    [100, '%', 'Mutual interest', 'heart'],
  ]

  return (
    <main className="nmh">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <header className="nmh-header" id="nmh-header">
        <div className="nmh-wrap nmh-header-in">
          <Link href="/" className="nmh-brand" aria-label="Native Matrimony home">
            <span className="nmh-brand-mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5EFE0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M12 12c0-3 2-5 5-5 0 3-2 5-5 5z"/><path d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5z"/><path d="M8 22h8"/></svg>
            </span>
            <span className="nmh-brand-copy"><span className="nmh-brand-name"><b>Native</b>Matrimony</span><small>Find love rooted in your heritage</small></span>
          </Link>
          <nav className="nmh-nav" aria-label="Main navigation">
            <Link href="/native" className="nmh-nav-link"><Icon name="pin" size={16} /> Browse Native Places</Link>
            <Link href="/login" className="nmh-nav-link">Login</Link>
            <Link href="/register" className="nmh-btn nmh-btn-maroon">Create Free Profile</Link>
          </nav>
          <div className="nmh-nav-mobile">
            <Link href="/login" className="nmh-mlogin">Login</Link>
            <Link href="/register" className="nmh-btn nmh-btn-maroon nmh-btn-sm">Create</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="nmh-hero">
        <div className="nmh-wrap nmh-hero-grid">
          {/* Left */}
          <div className="nmh-hero-left">
            <span className="nmh-pill"><Icon name="people" size={15} /> Native Place First Matrimony</span>
            <h1><span className="nmh-g">Search your native place.</span><br /><span className="nmh-m">Find your life partner.</span></h1>
            <p className="nmh-lede">The first matrimony platform built around native places and shared roots. Real people. Serious families. Better matches.</p>

            <div className="nmh-stats">
              {stats.map(([value, suffix, label, icon]) => (
                <div key={label} className="nmh-stat">
                  <span className="nmh-stat-ic"><Icon name={icon} size={20} /></span>
                  <div>
                    <strong data-count={value} data-suffix={suffix}>0{suffix}</strong>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="nmh-searchcard">
              <p className="nmh-searchcard-label"><Icon name="pin" size={16} /> Where is your native place?</p>
              <form action="/browse" className="nmh-search" role="search">
                <span className="nmh-search-ic"><Icon name="search" size={19} /></span>
                <input name="native_place" placeholder="Search your native place..." aria-label="Search your native place" autoComplete="off" />
                <button type="submit">Search</button>
              </form>
              <div className="nmh-popular">
                <span>Popular:</span>
                {popularPlaces.map(p => <Link key={p} href={`/browse?native_place=${encodeURIComponent(p)}`}>{p}</Link>)}
                <Link href="/native" className="nmh-viewall">View all →</Link>
              </div>
            </div>

            <div className="nmh-cta2">
              <Link href="/register" className="nmh-bigcta nmh-bigcta-maroon">
                <span className="nmh-bigcta-ic"><Icon name="people" size={18} /></span>
                <span><strong>Create Free Profile</strong><small>Takes less than 30 seconds</small></span>
              </Link>
              <Link href="/browse" className="nmh-bigcta nmh-bigcta-outline">
                <span className="nmh-bigcta-ic"><Icon name="pin" size={18} /></span>
                <span><strong>Browse Native Places</strong><small>See families from your place</small></span>
              </Link>
            </div>

            <div className="nmh-notice">
              <span className="nmh-notice-ic"><Icon name="bell" size={16} /></span>
              <p>Create once. We&apos;ll notify you when someone from your native place joins. <b>New families join every week.</b></p>
            </div>
          </div>

          {/* Right */}
          <div className="nmh-hero-right">
            <div className="nmh-card nmh-families" data-reveal>
              <p className="nmh-card-title"><Icon name="people" size={19} /> Families from your native places</p>
              <div className="nmh-place-rows">
                {places.map(p => (
                  <Link key={p.name} href={`/native/${slugify(p.name)}`} className="nmh-place-row">
                    <span className="nmh-place-ic"><Icon name="temple" size={20} /></span>
                    <span className="nmh-place-name">{p.name}</span>
                    <span className="nmh-place-stat"><b>{p.profiles.toLocaleString()}</b>Profiles</span>
                    <span className="nmh-place-stat nmh-hide-xs"><b>{p.month.toLocaleString()}</b>Joined this month</span>
                    <span className="nmh-place-chev"><Icon name="chevron" size={18} /></span>
                  </Link>
                ))}
              </div>
              <div className="nmh-priv">
                <span className="nmh-priv-ic"><Icon name="shield" size={16} /></span>
                <div><strong>Photos stay private until mutual acceptance</strong><span>No unsolicited messages. Only mutual interest.</span></div>
              </div>
            </div>

            <div className="nmh-founding" data-reveal>
              <span className="nmh-founding-ic"><Icon name="crown" size={22} /></span>
              <div className="nmh-founding-copy">
                <strong>Founding Member Advantage</strong>
                <span>First 100 families in every native place receive lifetime Founder status.</span>
              </div>
              <Link href="/register" className="nmh-btn nmh-btn-maroon nmh-btn-sm">Join Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="nmh-how">
        <div className="nmh-wrap">
          <p className="nmh-how-title"><em>—</em> How it works <em>—</em></p>
          <div className="nmh-how-grid">
            <div className="nmh-steps">
              {steps.map(([title, body, icon], i) => (
                <div key={title} className="nmh-step" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                  <span className="nmh-step-badge">{i + 1}</span>
                  <span className="nmh-step-ic"><Icon name={icon} size={22} /></span>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <blockquote className="nmh-quote" data-reveal>
              <span className="nmh-quote-mark">&ldquo;</span>
              <p>I found my match from my native place in just 2 weeks. The platform is simple, safe and family-friendly.</p>
              <cite>— Happy Member, Guntur</cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Why families trust */}
      <section className="nmh-trust">
        <div className="nmh-wrap">
          <h2>Why families trust NativeMatrimony</h2>
          <div className="nmh-trust-grid">
            {trust.map(([title, desc, icon]) => (
              <div key={title} className="nmh-trust-item" data-reveal>
                <span className="nmh-trust-ic"><Icon name={icon} size={20} /></span>
                <strong>{title}</strong>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeMotion />
    </main>
  )
}

const CSS = `
.nmh{--cream:#FBF6EC;--cream-2:#F6EEDC;--card:#FFFFFF;--green:#0E5A34;--green-d:#0A4227;--green-soft:#E8F1E7;--maroon:#7A1E29;--maroon-d:#611720;--gold:#C89D63;--ink:#243027;--muted:#6B7280;--line:#EBE3D4;background:var(--cream);color:var(--ink);font-family:var(--font-inter),system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.nmh *{box-sizing:border-box}
.nmh a{text-decoration:none;color:inherit}
.nmh h1,.nmh h2{font-family:var(--font-playfair),Georgia,serif;margin:0;letter-spacing:-.01em}
.nmh-wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.nmh a:focus-visible,.nmh button:focus-visible,.nmh input:focus-visible{outline:2px solid var(--green);outline-offset:2px;border-radius:8px}
@keyframes nmFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.nmh-anim [data-reveal]{opacity:0;transform:translateY(16px);transition:opacity .5s cubic-bezier(.22,.61,.36,1),transform .5s cubic-bezier(.22,.61,.36,1)}
.nmh-anim [data-reveal].nmhome-in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.nmh *{animation:none!important;transition:none!important}[data-reveal]{opacity:1!important;transform:none!important}}

.nmh-btn{display:inline-flex;align-items:center;justify-content:center;font-weight:600;border-radius:10px;transition:transform .15s,box-shadow .15s,background .15s;cursor:pointer}
.nmh-btn-maroon{background:var(--maroon);color:#fff!important;padding:11px 20px;font-size:14.5px;box-shadow:0 4px 12px rgba(122,30,41,.2)}
.nmh-btn-maroon:hover{background:var(--maroon-d);transform:translateY(-1px)}
.nmh-btn-sm{padding:9px 16px;font-size:13.5px}

/* Header */
.nmh-header{position:sticky;top:0;z-index:40;background:rgba(251,246,236,.8);backdrop-filter:blur(6px);border-bottom:1px solid transparent;transition:background .2s,border-color .2s,box-shadow .2s}
.nmh-header.nmhome-scrolled{background:rgba(251,246,236,.94);border-bottom-color:var(--line);box-shadow:0 4px 16px rgba(36,48,39,.05)}
.nmh-header-in{height:76px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nmh-brand{display:flex;align-items:center;gap:11px}
.nmh-brand-mark{width:40px;height:40px;border-radius:12px;background:radial-gradient(circle at 30% 25%,#1a774a,#0A4227);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 10px rgba(10,66,39,.24)}
.nmh-brand-name{font-family:var(--font-playfair),Georgia,serif;font-size:21px;color:var(--maroon);letter-spacing:-.01em;line-height:1}
.nmh-brand-name b{color:var(--green);font-weight:700}
.nmh-brand-copy small{display:block;font-size:11px;color:var(--muted);margin-top:2px;font-weight:500}
.nmh-nav{display:none;align-items:center;gap:26px;font-size:14.5px;font-weight:500}
.nmh-nav-link{display:inline-flex;align-items:center;gap:6px;color:var(--ink);transition:color .15s}
.nmh-nav-link:hover{color:var(--green)}
.nmh-nav-mobile{display:flex;align-items:center;gap:10px}
.nmh-mlogin{font-size:14px;font-weight:600;color:var(--ink);padding:8px}
@media(min-width:960px){.nmh-nav{display:flex}.nmh-nav-mobile{display:none}}

/* Hero */
.nmh-hero{position:relative;padding:40px 0 44px;background:radial-gradient(120% 90% at 100% 0%,#F3E9D4 0%,rgba(243,233,212,0) 50%),radial-gradient(80% 70% at 0% 30%,#E7EFE4 0%,rgba(231,239,228,0) 55%)}
.nmh-hero-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:32px;align-items:start}
@media(min-width:980px){.nmh-hero{padding:52px 0 60px}.nmh-hero-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.95fr);gap:48px}}
.nmh-hero-left{min-width:0;animation:nmFadeUp .5s ease-out both}
.nmh-pill{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line);color:var(--green);font-size:13px;font-weight:600;padding:7px 14px;border-radius:99px;box-shadow:0 1px 3px rgba(36,48,39,.05)}
.nmh-hero-left h1{font-size:38px;line-height:1.08;margin:18px 0 0;font-weight:600}
@media(min-width:980px){.nmh-hero-left h1{font-size:56px}}
.nmh-g{color:var(--green)}
.nmh-m{color:var(--maroon)}
.nmh-lede{font-size:16.5px;line-height:1.6;color:#4B5563;margin:18px 0 0;max-width:52ch}
.nmh-stats{display:grid;grid-template-columns:1fr 1fr;gap:18px 20px;margin:26px 0 0}
@media(min-width:560px){.nmh-stats{grid-template-columns:repeat(4,1fr)}}
.nmh-stat{display:flex;align-items:center;gap:10px}
.nmh-stat-ic{color:var(--green);flex-shrink:0}
.nmh-stat strong{display:block;font-family:var(--font-playfair),Georgia,serif;font-size:24px;font-weight:700;color:var(--green);line-height:1}
.nmh-stat span{display:block;font-size:12.5px;color:var(--muted);margin-top:3px}
.nmh-searchcard{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:26px;box-shadow:0 8px 26px rgba(36,48,39,.07)}
.nmh-searchcard-label{display:flex;align-items:center;gap:7px;font-size:14.5px;font-weight:600;color:var(--ink);margin:0 0 12px}
.nmh-searchcard-label svg{color:var(--green)}
.nmh-search{display:flex;align-items:center;background:#FBFAF6;border:1px solid var(--line);border-radius:12px;height:52px;padding-left:14px;transition:border-color .15s,box-shadow .15s}
.nmh-search:focus-within{border-color:var(--green);box-shadow:0 0 0 3px rgba(14,90,52,.1)}
.nmh-search-ic{color:var(--muted);display:flex;flex-shrink:0}
.nmh-search input{flex:1;min-width:0;height:100%;border:none;outline:none;background:transparent;font-size:15.5px;color:var(--ink);padding:0 10px;font-family:inherit}
.nmh-search input::placeholder{color:#A79E90}
.nmh-search button{flex-shrink:0;background:var(--maroon);color:#fff;border:none;height:44px;margin-right:4px;padding:0 24px;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s}
.nmh-search button:hover{background:var(--maroon-d)}
.nmh-popular{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px;font-size:13px}
.nmh-popular>span{color:var(--muted);font-weight:600}
.nmh-popular a{background:var(--green-soft);color:var(--green-d);padding:5px 12px;border-radius:99px;font-size:12.5px;font-weight:600;transition:background .15s}
.nmh-popular a:hover{background:#DCE9D9}
.nmh-viewall{background:none!important;color:var(--maroon)!important;font-weight:700;padding:5px 4px!important}
.nmh-cta2{display:grid;grid-template-columns:1fr;gap:12px;margin-top:16px}
@media(min-width:520px){.nmh-cta2{grid-template-columns:1fr 1fr}}
.nmh-bigcta{display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:14px;transition:transform .15s,box-shadow .15s,border-color .15s}
.nmh-bigcta strong{display:block;font-size:15px;font-weight:700}
.nmh-bigcta small{display:block;font-size:12px;opacity:.85;margin-top:2px}
.nmh-bigcta-ic{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmh-bigcta-maroon{background:var(--maroon);color:#fff;box-shadow:0 6px 16px rgba(122,30,41,.22)}
.nmh-bigcta-maroon .nmh-bigcta-ic{background:rgba(255,255,255,.15)}
.nmh-bigcta-maroon:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(122,30,41,.28)}
.nmh-bigcta-outline{background:#fff;color:var(--ink);border:1px solid var(--line)}
.nmh-bigcta-outline .nmh-bigcta-ic{background:var(--green-soft);color:var(--green)}
.nmh-bigcta-outline:hover{transform:translateY(-2px);border-color:var(--green);box-shadow:0 10px 20px rgba(36,48,39,.06)}
.nmh-notice{display:flex;align-items:flex-start;gap:11px;background:var(--green-soft);border:1px solid #D9E7D6;border-radius:12px;padding:13px 15px;margin-top:16px}
.nmh-notice-ic{color:var(--green);flex-shrink:0;margin-top:1px}
.nmh-notice p{margin:0;font-size:13.5px;line-height:1.5;color:#3B5240}
.nmh-notice b{color:var(--green-d);font-weight:700}

/* Right column */
.nmh-hero-right{min-width:0;display:flex;flex-direction:column;gap:20px;animation:nmFadeUp .5s ease-out both;animation-delay:.12s}
.nmh-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 10px 34px rgba(36,48,39,.08)}
.nmh-card-title{display:flex;align-items:center;gap:9px;font-size:15.5px;font-weight:700;color:var(--ink);margin:0 0 14px}
.nmh-card-title svg{color:var(--maroon)}
.nmh-place-rows{display:flex;flex-direction:column}
.nmh-place-row{display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid #F3EEE2;transition:background .15s}
.nmh-place-row:last-child{border-bottom:none}
.nmh-place-row:hover{background:#FBFAF5}
.nmh-place-ic{width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#1a774a,#0A4227);color:#EAF3E7;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmh-place-name{font-size:15px;font-weight:700;color:var(--ink);flex:1;min-width:0}
.nmh-place-stat{text-align:left;min-width:76px}
.nmh-place-stat b{display:block;font-size:16px;font-weight:800;color:var(--green);font-family:var(--font-playfair),Georgia,serif}
.nmh-place-stat{font-size:11.5px;color:var(--muted)}
.nmh-place-chev{color:#C7BEAE;flex-shrink:0}
@media(max-width:420px){.nmh-hide-xs{display:none}}
.nmh-priv{display:flex;align-items:center;gap:11px;background:var(--green-soft);border-radius:12px;padding:12px 14px;margin-top:14px}
.nmh-priv-ic{width:34px;height:34px;border-radius:10px;background:#fff;color:var(--green);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmh-priv strong{display:block;font-size:13.5px;color:var(--ink);font-weight:700}
.nmh-priv span{display:block;font-size:12px;color:var(--muted);margin-top:1px}
.nmh-founding{display:flex;align-items:center;gap:14px;background:linear-gradient(120deg,#FBF3E3,#F5E9CF);border:1px solid #EAD9B6;border-radius:18px;padding:18px 20px}
.nmh-founding-ic{width:46px;height:46px;border-radius:50%;background:var(--maroon);color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmh-founding-copy{flex:1;min-width:0}
.nmh-founding-copy strong{display:block;font-size:15px;color:var(--ink);font-weight:700}
.nmh-founding-copy span{display:block;font-size:12.5px;color:#6E6250;margin-top:3px;line-height:1.45}

/* How it works */
.nmh-how{padding:56px 0}
.nmh-how-title{text-align:center;font-family:var(--font-playfair),Georgia,serif;font-size:24px;color:var(--ink);margin:0 0 34px;font-weight:600}
.nmh-how-title em{color:var(--gold);font-style:normal;margin:0 8px;letter-spacing:2px}
.nmh-how-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:22px}
@media(min-width:900px){.nmh-how-grid{grid-template-columns:1.7fr 1fr;align-items:center;gap:32px}}
.nmh-steps{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:640px){.nmh-steps{grid-template-columns:repeat(3,1fr)}}
.nmh-step{position:relative;background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px 18px;box-shadow:0 4px 14px rgba(36,48,39,.05)}
.nmh-step-badge{position:absolute;top:-12px;left:18px;width:26px;height:26px;border-radius:50%;background:var(--green);color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(14,90,52,.3)}
.nmh-step-ic{width:46px;height:46px;border-radius:13px;background:var(--green-soft);color:var(--green);display:flex;align-items:center;justify-content:center;margin:6px 0 12px}
.nmh-step strong{display:block;font-size:15.5px;font-weight:700;color:var(--ink);margin-bottom:5px}
.nmh-step p{margin:0;font-size:13.5px;line-height:1.55;color:var(--muted)}
.nmh-quote{margin:0;background:linear-gradient(150deg,#0E5A34,#0A4227);color:#EAF3E7;border-radius:18px;padding:26px 24px;position:relative;box-shadow:0 12px 30px rgba(10,66,39,.22)}
.nmh-quote-mark{font-family:var(--font-playfair),Georgia,serif;font-size:52px;line-height:0;color:var(--gold);position:absolute;top:30px;left:22px;opacity:.6}
.nmh-quote p{margin:14px 0 0;font-size:16px;line-height:1.6;font-weight:500;padding-left:22px}
.nmh-quote cite{display:block;margin-top:16px;padding-left:22px;font-style:normal;font-size:13.5px;color:#B7D3C0;font-weight:600}

/* Trust */
.nmh-trust{padding:8px 0 64px}
.nmh-trust h2{text-align:center;font-size:26px;color:var(--ink);margin:0 0 30px}
.nmh-trust-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px 18px}
@media(min-width:720px){.nmh-trust-grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1040px){.nmh-trust-grid{grid-template-columns:repeat(6,1fr)}}
.nmh-trust-item{text-align:left}
.nmh-trust-ic{width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#1a774a,#0A4227);color:#EAF3E7;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.nmh-trust-item strong{display:block;font-size:14.5px;font-weight:700;color:var(--ink);margin-bottom:5px}
.nmh-trust-item p{margin:0;font-size:12.5px;line-height:1.5;color:var(--muted)}
`
