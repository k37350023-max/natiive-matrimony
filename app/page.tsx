import Link from 'next/link'
import { slugify } from '@/lib/nativePlaces'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 600

const popularPlaces = ['Hyderabad', 'Guntur', 'Warangal', 'Nellore', 'Vijayawada', 'Karimnagar', 'Rajahmundry', 'Tirupati']

const steps: Array<[string, string, string]> = [
  ['Search your native place', 'Enter your hometown, district, or city to see families with the same roots.', 'pin'],
  ['Create your free profile', 'Takes 30 seconds. Add your basics — everything else is optional.', 'card'],
  ['Connect on mutual interest', 'Chat and contact open only when both families agree. No random messages.', 'heart'],
]

const trust: Array<[string, string]> = [
  ['Verified profiles', 'shield'],
  ['Privacy first', 'lock'],
  ['Family friendly', 'family'],
  ['Mutual connection only', 'heart'],
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
    card: 'M4 5h16v14H4z M8 9h8 M8 13h8 M8 17h5',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
    lock: 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v10H5z',
    family: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87',
    search: 'm21 21-4.35-4.35 M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
    check: 'M20 6 9 17l-5-5',
    star: 'M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.check} />
    </svg>
  )
}

async function getCounts() {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const featured = 'Guntur'
    const [{ count: total }, { count: featuredCount }] = await Promise.all([
      sb.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      sb.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved').ilike('native_district', featured),
    ])
    return { total: total ?? 0, featured, featuredCount: featuredCount ?? 0 }
  } catch {
    return { total: 0, featured: 'Guntur', featuredCount: 0 }
  }
}

function PreviewCard({ place, count }: { place: string; count: number }) {
  const samples = [
    { init: 'A', age: 29, work: 'Product Manager' },
    { init: 'R', age: 31, work: 'Software Engineer' },
    { init: 'S', age: 27, work: 'Doctor' },
  ]
  return (
    <aside className="nmhome-preview" aria-label={`${place} profiles preview`}>
      <div className="nmhome-preview-head">
        <div>
          <span className="nmhome-preview-place"><Icon name="pin" size={15} />{place}</span>
          <strong>{count > 0 ? `${count.toLocaleString()} ${count === 1 ? 'profile' : 'profiles'} with roots here` : `Be among the first from ${place}`}</strong>
        </div>
        <span className="nmhome-preview-badge">Private</span>
      </div>
      <ul className="nmhome-preview-list">
        {samples.map((s, i) => (
          <li key={i}>
            <span className="nmhome-preview-avatar" aria-hidden="true">{s.init}</span>
            <div className="nmhome-preview-meta">
              <span className="nmhome-preview-name">Private profile</span>
              <span className="nmhome-preview-sub">{s.age} · Native place: {place} · {s.work}</span>
            </div>
            <span className="nmhome-preview-lock" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            </span>
          </li>
        ))}
      </ul>
      <p className="nmhome-preview-note">
        <Icon name="lock" size={13} /> Photos &amp; contact stay private until you both connect.
      </p>
    </aside>
  )
}

export default async function Home() {
  const { total, featured, featuredCount } = await getCounts()

  return (
    <main className="nmhome">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="nmhome-header">
        <div className="nmhome-header-in">
          <Link href="/" className="nmhome-brand" aria-label="Native Matrimony home">
            <span className="nmhome-brand-mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3E4C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
            <span className="nmhome-brand-text"><b>Native</b>Matrimony</span>
          </Link>
          <nav className="nmhome-nav" aria-label="Main navigation">
            <Link href="/browse">Browse Profiles</Link>
            <Link href="/native">Native Places</Link>
            <Link href="/pricing">Membership</Link>
            <Link href="/login">Login</Link>
            <Link href="/register" className="nmhome-nav-cta">Create Profile</Link>
          </nav>
          <div className="nmhome-header-mobile">
            <Link href="/login" className="nmhome-mlogin">Login</Link>
            <Link href="/register" className="nmhome-mcreate">Create</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="nmhome-hero">
        <div className="nmhome-hero-in">
          <div className="nmhome-hero-copy">
            <span className="nmhome-eyebrow"><Icon name="pin" size={14} /> Native-place-first matrimony</span>
            <h1>Find serious matches from your <span className="nmhome-hl">native place</span>.</h1>
            <p className="nmhome-lede">Start with your hometown. Browse verified families who share your roots, and connect only when interest is mutual.</p>

            <form action="/browse" className="nmhome-search" role="search">
              <span className="nmhome-search-icon"><Icon name="search" size={20} /></span>
              <input name="native_place" placeholder="Guntur, Warangal, Nellore..." aria-label="Search by native place" />
              <button type="submit">Search Native Place</button>
            </form>

            <div className="nmhome-cta-row">
              <Link href="/register" className="nmhome-btn-primary">Create Free Profile</Link>
              <Link href="/browse" className="nmhome-btn-ghost">Browse Profiles</Link>
            </div>

            <div className="nmhome-chips" aria-label="Popular native places">
              <span>Popular:</span>
              {popularPlaces.slice(0, 6).map(p => (
                <Link key={p} href={`/browse?native_place=${encodeURIComponent(p)}`}>{p}</Link>
              ))}
            </div>
          </div>

          <PreviewCard place={featured} count={featuredCount} />
        </div>
      </section>

      {/* Conversion banner */}
      <section className="nmhome-banner">
        <div className="nmhome-banner-in">
          <span className="nmhome-banner-star" aria-hidden="true"><Icon name="star" size={18} /></span>
          <p><strong>Founding offer:</strong> the first 1,000 profiles in each district get <strong>2 years of Premium free</strong>.</p>
          <Link href="/register">Claim your spot</Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="nmhome-trust" aria-label="Why families trust us">
        {trust.map(([label, icon]) => (
          <div key={label}><span><Icon name={icon} size={18} /></span>{label}</div>
        ))}
      </section>

      {/* How it works */}
      <section className="nmhome-how" id="how-it-works">
        <p className="nmhome-kicker">How it works</p>
        <h2>Three steps to the right family</h2>
        <div className="nmhome-how-grid">
          {steps.map(([title, body, icon], i) => (
            <article key={title}>
              <span className="nmhome-how-icon"><Icon name={icon} size={22} /></span>
              <strong><em>{i + 1}</em>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Featured places */}
      <section className="nmhome-places">
        <div className="nmhome-places-head">
          <div>
            <p className="nmhome-kicker">Browse by roots</p>
            <h2>Start with your native place</h2>
          </div>
          <Link href="/native" className="nmhome-places-all">All native places →</Link>
        </div>
        <div className="nmhome-place-grid">
          {popularPlaces.map(p => (
            <Link key={p} href={`/native/${slugify(p)}`} className="nmhome-place-card">
              <span className="nmhome-place-dot" aria-hidden="true" />
              <strong>{p}</strong>
              <span>View profiles →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="nmhome-final">
        <div>
          <h2>Be found when the right family searches your place.</h2>
          <p>Free to start · {total > 0 ? `${total.toLocaleString()} verified profiles and growing` : 'A growing community of serious families'} · Private until you connect.</p>
        </div>
        <div className="nmhome-cta-row">
          <Link href="/register" className="nmhome-btn-primary">Create Free Profile</Link>
          <Link href="/browse" className="nmhome-btn-ghost nmhome-btn-ghost-dark">Search Native Place</Link>
        </div>
      </section>
    </main>
  )
}

const CSS = `
.nmhome{--iv:#FBF6EC;--card:#FFFFFF;--maroon:#7A1E29;--maroon-d:#5E141E;--gold:#C6A15B;--gold-s:#EEE0C4;--ink:#2B1A1C;--muted:#7A6A63;--line:#EBDFCB;background:var(--iv);color:var(--ink);font-family:var(--font-inter),system-ui,sans-serif;min-height:100vh}
.nmhome a{text-decoration:none;color:inherit}
.nmhome h1,.nmhome h2{font-family:var(--font-playfair),Georgia,serif;letter-spacing:-.01em;margin:0}
.nmhome-header{position:sticky;top:0;z-index:40;background:rgba(251,246,236,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.nmhome-header-in{max-width:1120px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nmhome-brand{display:flex;align-items:center;gap:10px}
.nmhome-brand-mark{width:34px;height:34px;border-radius:9px;background:linear-gradient(150deg,#7A1E29,#5E141E);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(94,20,30,.22)}
.nmhome-brand-text{font-family:var(--font-playfair),Georgia,serif;font-size:20px;color:var(--ink);letter-spacing:-.01em}
.nmhome-brand-text b{color:var(--maroon);font-weight:700}
.nmhome-hl{position:relative;white-space:nowrap;color:var(--maroon)}
.nmhome-hl:after{content:"";position:absolute;left:0;right:0;bottom:.06em;height:.16em;background:linear-gradient(90deg,var(--gold),#E4C784);border-radius:2px;opacity:.55;z-index:-1}
.nmhome-nav{display:none;align-items:center;gap:26px;font-size:14.5px;font-weight:500;color:#4A3A36}
.nmhome-nav a:hover{color:var(--maroon)}
.nmhome-nav-cta{background:var(--maroon);color:#fff!important;padding:9px 18px;border-radius:8px;font-weight:700}
.nmhome-nav-cta:hover{background:var(--maroon-d)}
.nmhome-header-mobile{display:flex;align-items:center;gap:10px}
.nmhome-mlogin{font-size:14px;font-weight:600;color:#4A3A36;padding:8px 6px}
.nmhome-mcreate{background:var(--maroon);color:#fff!important;padding:9px 16px;border-radius:8px;font-weight:700;font-size:14px}
@media(min-width:900px){.nmhome-nav{display:flex}.nmhome-header-mobile{display:none}}

.nmhome-hero{padding:34px 20px 8px;position:relative;overflow:hidden;background:radial-gradient(120% 90% at 85% -10%,#F7EAD3 0%,rgba(247,234,211,0) 55%),radial-gradient(90% 70% at -5% 10%,#F6E7E3 0%,rgba(246,231,227,0) 45%)}
.nmhome-hero-in{max-width:1120px;margin:0 auto;display:grid;gap:30px;align-items:center}
@media(min-width:900px){.nmhome-hero{padding:56px 20px 20px}.nmhome-hero-in{grid-template-columns:1.05fr .95fr;gap:48px}}
.nmhome-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;letter-spacing:.03em;color:var(--maroon);background:#fff;border:1px solid var(--gold-s);padding:6px 12px;border-radius:99px}
.nmhome-hero-copy h1{font-size:34px;line-height:1.12;margin:16px 0 0;color:#22140F}
@media(min-width:900px){.nmhome-hero-copy h1{font-size:48px}}
.nmhome-lede{font-size:16px;line-height:1.65;color:var(--muted);margin:14px 0 0;max-width:520px}
.nmhome-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:7px 7px 7px 14px;margin-top:22px;box-shadow:0 10px 30px rgba(122,30,41,.06);flex-wrap:wrap}
.nmhome-search-icon{color:var(--maroon);display:flex;flex-shrink:0}
.nmhome-search input{flex:1;min-width:150px;border:none;outline:none;font-size:16px;color:var(--ink);background:transparent;padding:10px 2px}
.nmhome-search input::placeholder{color:#B9A99F}
.nmhome-search button{background:var(--maroon);color:#fff;border:none;border-radius:9px;padding:13px 18px;font-size:14.5px;font-weight:700;cursor:pointer;white-space:nowrap;flex:1;min-width:160px}
.nmhome-search button:hover{background:var(--maroon-d)}
@media(min-width:520px){.nmhome-search button{flex:0 0 auto}}
.nmhome-cta-row{display:flex;gap:12px;margin-top:14px;flex-wrap:wrap}
.nmhome-btn-primary{background:var(--maroon);color:#fff!important;padding:13px 22px;border-radius:9px;font-weight:700;font-size:15px}
.nmhome-btn-primary:hover{background:var(--maroon-d)}
.nmhome-btn-ghost{background:#fff;color:var(--maroon)!important;padding:13px 22px;border-radius:9px;font-weight:700;font-size:15px;border:1px solid var(--gold-s)}
.nmhome-btn-ghost:hover{background:#FCF7EC}
.nmhome-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:20px;font-size:13px;color:var(--muted)}
.nmhome-chips>span{font-weight:600}
.nmhome-chips a{background:#fff;border:1px solid var(--line);padding:6px 12px;border-radius:99px;font-size:13px;font-weight:600;color:#4A3A36}
.nmhome-chips a:hover{border-color:var(--gold);color:var(--maroon)}

.nmhome-preview{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 20px 50px rgba(43,26,28,.08)}
.nmhome-preview-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.nmhome-preview-place{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:var(--maroon);text-transform:uppercase;letter-spacing:.04em}
.nmhome-preview-head strong{display:block;font-size:15.5px;margin-top:4px;color:#22140F;font-weight:700}
.nmhome-preview-badge{background:#FBF1E0;color:#8A6A22;border:1px solid var(--gold-s);font-size:11px;font-weight:800;padding:4px 10px;border-radius:99px;white-space:nowrap}
.nmhome-preview-list{list-style:none;margin:0;padding:12px 0 0;display:flex;flex-direction:column;gap:10px}
.nmhome-preview-list li{display:flex;align-items:center;gap:12px}
.nmhome-preview-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#8A2432,#5E141E);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;filter:blur(3px);flex-shrink:0}
.nmhome-preview-meta{flex:1;min-width:0}
.nmhome-preview-name{display:block;font-weight:700;font-size:14px;color:#3A2A26;filter:blur(3.5px);user-select:none}
.nmhome-preview-sub{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}
.nmhome-preview-lock{color:#B79A5E;flex-shrink:0}
.nmhome-preview-note{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted);margin:14px 0 0;padding-top:12px;border-top:1px solid var(--line)}
.nmhome-preview-note svg{color:var(--maroon)}

.nmhome-banner{padding:22px 20px 0}
.nmhome-banner-in{max-width:1120px;margin:0 auto;background:linear-gradient(100deg,#6E1423,#8A2A38);border-radius:14px;padding:16px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;border:1px solid #5E141E}
.nmhome-banner-star{color:var(--gold);display:flex}
.nmhome-banner-in p{color:#F6E9CE;font-size:14.5px;margin:0;flex:1;min-width:200px;line-height:1.5}
.nmhome-banner-in p strong{color:#fff}
.nmhome-banner-in a{background:var(--gold);color:#3A230A!important;font-weight:800;font-size:13.5px;padding:10px 18px;border-radius:8px;white-space:nowrap}
.nmhome-banner-in a:hover{background:#D8B876}

.nmhome-trust{max-width:1120px;margin:26px auto 0;padding:0 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(min-width:760px){.nmhome-trust{grid-template-columns:repeat(4,1fr)}}
.nmhome-trust>div{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px 16px;font-size:13.5px;font-weight:600;color:#3A2A26}
.nmhome-trust>div span{width:32px;height:32px;border-radius:8px;background:#FBF1E0;color:var(--maroon);display:flex;align-items:center;justify-content:center;flex-shrink:0}

.nmhome-kicker{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin:0}
.nmhome-how{max-width:1120px;margin:0 auto;padding:52px 20px 10px;text-align:center}
.nmhome-how h2{font-size:28px;margin:8px 0 0;color:#22140F}
.nmhome-how-grid{display:grid;gap:16px;margin-top:26px;text-align:left}
@media(min-width:760px){.nmhome-how-grid{grid-template-columns:repeat(3,1fr)}}
.nmhome-how-grid article{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px}
.nmhome-how-icon{width:44px;height:44px;border-radius:11px;background:#FBF1E0;color:var(--maroon);display:flex;align-items:center;justify-content:center}
.nmhome-how-grid strong{display:flex;align-items:center;gap:10px;font-size:16.5px;margin:16px 0 6px;color:#22140F;font-weight:700}
.nmhome-how-grid strong em{width:26px;height:26px;border-radius:50%;background:var(--maroon);color:#fff;font-style:normal;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmhome-how-grid p{font-size:14px;line-height:1.6;color:var(--muted);margin:0}

.nmhome-places{max-width:1120px;margin:0 auto;padding:44px 20px 10px}
.nmhome-places-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:18px}
.nmhome-places-head h2{font-size:26px;margin:6px 0 0;color:#22140F}
.nmhome-places-all{font-size:14px;font-weight:700;color:var(--maroon);white-space:nowrap}
.nmhome-place-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(min-width:760px){.nmhome-place-grid{grid-template-columns:repeat(4,1fr)}}
.nmhome-place-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 16px 14px;position:relative;transition:border-color .15s,transform .15s}
.nmhome-place-card:hover{border-color:var(--gold);transform:translateY(-2px)}
.nmhome-place-dot{position:absolute;top:16px;right:16px;width:8px;height:8px;border-radius:50%;background:var(--gold)}
.nmhome-place-card strong{display:block;font-size:16px;color:#22140F;font-weight:700}
.nmhome-place-card span{display:block;font-size:12.5px;color:var(--maroon);font-weight:600;margin-top:6px}

.nmhome-final{max-width:1120px;margin:44px auto 56px;padding:0 20px}
.nmhome-final>div{background:linear-gradient(150deg,#FFFDF8,#F7EEDD);border:1px solid var(--gold-s);border-radius:18px;padding:34px 26px;text-align:center}
.nmhome-final h2{font-size:26px;color:#22140F;max-width:560px;margin:0 auto}
.nmhome-final p{font-size:14.5px;color:var(--muted);margin:12px auto 0;max-width:520px}
.nmhome-final .nmhome-cta-row{justify-content:center;margin-top:22px}
.nmhome-btn-ghost-dark{background:#fff;border-color:var(--line)}
`
