import Link from 'next/link'
import { slugify } from '@/lib/nativePlaces'
import { createClient } from '@supabase/supabase-js'
import HomeMotion from './components/HomeMotion'

export const revalidate = 600

const popularPlaces = ['Hyderabad', 'Guntur', 'Warangal', 'Nellore', 'Vijayawada', 'Karimnagar', 'Rajahmundry', 'Tirupati', 'Kadapa', 'Khammam']

const steps: Array<[string, string, string]> = [
  ['Search your native place', 'Enter your hometown, district, or city to see families with the same roots.', 'pin'],
  ['Create your free profile', 'Takes 30 seconds. Add your basics — everything else is optional.', 'card'],
  ['Connect on mutual interest', 'Chat and contact open only when both families agree. No random messages.', 'heart'],
]

const trust: Array<[string, string, string]> = [
  ['Verified profiles', 'Phone-verified and reviewed before they go live.', 'shield'],
  ['Privacy first', 'Photos and contact stay hidden until you connect.', 'lock'],
  ['Mutual interest', 'Chat opens only when both families say yes.', 'heart'],
  ['Family friendly', 'Built around native place, parents, and serious intent.', 'family'],
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
    arrow: 'M5 12h14 M13 5l7 7-7 7',
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
    { init: 'A', age: 29, work: 'Product Manager', tag: 'Same native place' },
    { init: 'R', age: 31, work: 'Software Engineer', tag: 'Verified' },
    { init: 'S', age: 27, work: 'Doctor', tag: 'Active recently' },
  ]
  return (
    <aside className="nmhome-preview nm-fu" style={{ animationDelay: '.3s' }} aria-label={`${place} profiles preview`}>
      <span className="nmhome-preview-badge">Private</span>
      <div className="nmhome-preview-head">
        <span className="nmhome-preview-place"><Icon name="pin" size={14} />{place}</span>
        <strong>{count > 0 ? `${count.toLocaleString()} ${count === 1 ? 'profile' : 'profiles'} with roots here` : `Be among the first from ${place}`}</strong>
      </div>
      <ul className="nmhome-preview-list">
        {samples.map((s, i) => (
          <li key={i}>
            <span className="nmhome-preview-avatar" aria-hidden="true">{s.init}</span>
            <div className="nmhome-preview-meta">
              <span className="nmhome-preview-name">Private profile</span>
              <span className="nmhome-preview-sub">{s.age} · {s.work} · {place}</span>
            </div>
            <span className="nmhome-preview-tag">{s.tag}</span>
          </li>
        ))}
      </ul>
      <Link href={`/browse?native_place=${encodeURIComponent(place)}`} className="nmhome-preview-cta">
        View {place} profiles <Icon name="arrow" size={16} />
      </Link>
      <p className="nmhome-preview-note"><Icon name="lock" size={13} /> Photos &amp; contact stay private until you both connect.</p>
    </aside>
  )
}

export default async function Home() {
  const { total, featured, featuredCount } = await getCounts()
  const stats: Array<[number, string, string]> = [
    [total, '+', 'Verified profiles'],
    [500, '+', 'Native places covered'],
    [100, '%', 'Private until you connect'],
    [2, ' yrs', 'Premium free for founders'],
  ]

  return (
    <main className="nmhome">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="nmhome-header" id="nmhome-header">
        <div className="nmhome-header-in">
          <Link href="/" className="nmhome-brand" aria-label="Native Matrimony home">
            <span className="nmhome-brand-mark" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F3E4C6" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
            <span className="nmhome-brand-text"><b>Native</b>Matrimony</span>
          </Link>
          <nav className="nmhome-nav" aria-label="Main navigation">
            <Link href="/browse">Browse Profiles</Link>
            <Link href="/native">Native Places</Link>
            <Link href="/pricing">Membership</Link>
            <Link href="/login" className="nmhome-nav-login">Login</Link>
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
            <span className="nmhome-eyebrow nm-fu" style={{ animationDelay: '.05s' }}><Icon name="pin" size={13} /> Native-place-first matrimony</span>
            <h1 className="nm-fu" style={{ animationDelay: '.1s' }}>Find serious matches from your <span className="nmhome-hl">native place</span></h1>
            <p className="nmhome-lede nm-fu" style={{ animationDelay: '.16s' }}>Browse verified families who share your roots. Connect only when the interest is mutual.</p>

            <form action="/browse" className="nmhome-search nm-fu" style={{ animationDelay: '.22s' }} role="search">
              <span className="nmhome-search-icon"><Icon name="search" size={22} /></span>
              <input name="native_place" placeholder="Search your hometown..." aria-label="Search by native place" autoComplete="off" />
              <button type="submit" aria-label="Search native place">Search</button>
            </form>

            <div className="nmhome-cta-row nm-fu" style={{ animationDelay: '.28s' }}>
              <Link href="/register" className="nmhome-btn-primary">Create Free Profile</Link>
              <Link href="/browse" className="nmhome-btn-outline">Browse Profiles</Link>
            </div>

            <div className="nmhome-chips-wrap nm-fu" style={{ animationDelay: '.34s' }}>
              <span className="nmhome-chips-label">Popular hometowns</span>
              <div className="nmhome-chips" aria-label="Popular hometowns">
                {popularPlaces.map(p => (
                  <Link key={p} href={`/browse?native_place=${encodeURIComponent(p)}`}>{p}</Link>
                ))}
              </div>
            </div>
          </div>

          <PreviewCard place={featured} count={featuredCount} />
        </div>
      </section>

      {/* Trust indicators */}
      <section className="nmhome-trust" data-reveal aria-label="Why families trust us">
        {trust.map(([title, desc, icon]) => (
          <div key={title} className="nmhome-trust-card">
            <span className="nmhome-trust-icon"><Icon name={icon} size={18} /></span>
            <strong>{title}</strong>
            <p>{desc}</p>
          </div>
        ))}
      </section>

      {/* Social proof */}
      <section className="nmhome-stats" data-reveal aria-label="At a glance">
        {stats.map(([value, suffix, label]) => (
          <div key={label} className="nmhome-stat">
            <strong data-count={value} data-suffix={suffix}>0{suffix}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      {/* Conversion banner */}
      <section className="nmhome-banner">
        <div className="nmhome-banner-in" data-reveal>
          <span className="nmhome-banner-star" aria-hidden="true"><Icon name="star" size={20} /></span>
          <p><strong>Founding offer</strong><br />First 1,000 profiles in each district get <b>2 years of Premium free</b>.</p>
          <Link href="/register">Claim your spot</Link>
        </div>
      </section>

      {/* How it works */}
      <section className="nmhome-how" id="how-it-works">
        <p className="nmhome-kicker">How it works</p>
        <h2>Three steps to the right family</h2>
        <div className="nmhome-how-grid">
          {steps.map(([title, body, icon], i) => (
            <article key={title} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
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
          <Link href="/native" className="nmhome-places-all">All native places <Icon name="arrow" size={15} /></Link>
        </div>
        <div className="nmhome-place-grid">
          {popularPlaces.slice(0, 8).map((p, i) => (
            <Link key={p} href={`/native/${slugify(p)}`} className="nmhome-place-card" data-reveal style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
              <strong>{p}</strong>
              <span>View profiles <Icon name="arrow" size={13} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="nmhome-final">
        <div data-reveal>
          <h2>Be found when the right family searches your place.</h2>
          <p>Free to start · {total > 0 ? `${total.toLocaleString()} verified profiles and growing` : 'A growing community of serious families'} · Private until you connect.</p>
          <div className="nmhome-cta-row nmhome-cta-center">
            <Link href="/register" className="nmhome-btn-primary">Create Free Profile</Link>
            <Link href="/browse" className="nmhome-btn-outline">Browse Profiles</Link>
          </div>
        </div>
      </section>

      <HomeMotion />
    </main>
  )
}

const CSS = `
.nmhome{--cream:#FBF8F3;--card:#FFFFFF;--maroon:#7A2434;--maroon-d:#611B29;--gold:#C89D63;--gold-bg:#FAF3E7;--gold-bd:#EBDCBF;--ink:#2D2D2D;--ink-2:#3F3F46;--muted:#6B7280;--line:#EEE7DB;--r:16px;background:var(--cream);color:var(--ink);font-family:var(--font-inter),system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.nmhome *{box-sizing:border-box}
.nmhome a{text-decoration:none;color:inherit}
.nmhome h1,.nmhome h2{font-family:var(--font-playfair),Georgia,serif;letter-spacing:-.015em;margin:0;color:var(--ink)}
.nmhome a:focus-visible,.nmhome button:focus-visible,.nmhome input:focus-visible{outline:2px solid var(--maroon);outline-offset:2px;border-radius:8px}
@keyframes nmFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.nm-fu{opacity:0;animation:nmFadeUp .5s cubic-bezier(.22,.61,.36,1) both}
.nmhome-anim [data-reveal]{opacity:0;transform:translateY(16px);transition:opacity .5s cubic-bezier(.22,.61,.36,1),transform .5s cubic-bezier(.22,.61,.36,1)}
.nmhome-anim [data-reveal].nmhome-in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.nmhome *{animation:none!important;transition:none!important}.nm-fu,[data-reveal]{opacity:1!important;transform:none!important}}

/* Header */
.nmhome-header{position:sticky;top:0;z-index:40;background:rgba(251,248,243,.7);backdrop-filter:blur(6px);border-bottom:1px solid transparent;transition:background .2s,border-color .2s,box-shadow .2s}
.nmhome-header.nmhome-scrolled{background:rgba(251,248,243,.88);backdrop-filter:blur(14px);border-bottom-color:var(--line);box-shadow:0 1px 0 rgba(45,45,45,.02),0 6px 20px rgba(45,45,45,.04)}
.nmhome-header-in{max-width:1160px;margin:0 auto;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;gap:18px}
.nmhome-brand{display:flex;align-items:center;gap:9px}
.nmhome-brand-mark{width:28px;height:28px;border-radius:8px;background:linear-gradient(150deg,#8A2A3C,#611B29);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(97,27,41,.24)}
.nmhome-brand-text{font-family:var(--font-playfair),Georgia,serif;font-size:18px;color:var(--ink);letter-spacing:-.01em}
.nmhome-brand-text b{color:var(--maroon);font-weight:700}
.nmhome-nav{display:none;align-items:center;gap:28px;font-size:14px;font-weight:500;color:var(--ink-2)}
.nmhome-nav a{transition:color .15s}
.nmhome-nav a:not(.nmhome-nav-cta):hover{color:var(--maroon)}
.nmhome-nav-login{color:var(--ink)}
.nmhome-nav-cta{background:linear-gradient(140deg,#8A2A3C,#6E2030);color:#fff!important;padding:10px 18px;border-radius:11px;font-weight:600;box-shadow:0 3px 10px rgba(122,36,52,.22);transition:transform .16s cubic-bezier(.22,.61,.36,1),box-shadow .16s}
.nmhome-nav-cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(122,36,52,.28)}
.nmhome-nav-cta:active{transform:translateY(0)}
.nmhome-header-mobile{display:flex;align-items:center;gap:8px}
.nmhome-mlogin{font-size:14px;font-weight:600;color:var(--ink-2);padding:10px 8px;min-height:44px;display:flex;align-items:center}
.nmhome-mcreate{background:linear-gradient(140deg,#8A2A3C,#6E2030);color:#fff!important;padding:0 16px;height:40px;display:flex;align-items:center;border-radius:11px;font-weight:600;font-size:14px}
.nmhome-mcreate:active{transform:scale(.97)}
@media(min-width:900px){.nmhome-nav{display:flex}.nmhome-header-mobile{display:none}.nmhome-header-in{height:66px;padding:0 28px}}

/* Hero */
.nmhome-hero{padding:44px 24px 16px;position:relative;overflow:hidden;background:radial-gradient(130% 78% at 88% -18%,#F6E7D2 0%,rgba(246,231,210,0) 54%),radial-gradient(88% 58% at -8% 6%,#F6E7E4 0%,rgba(246,231,228,0) 48%)}
.nmhome-hero-in{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:32px;align-items:center}
.nmhome-hero-copy{min-width:0}
@media(min-width:900px){.nmhome-hero{padding:80px 24px 44px}.nmhome-hero-in{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:60px}}
.nmhome-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--maroon);background:#fff;border:1px solid var(--line);padding:7px 14px;border-radius:99px;box-shadow:0 1px 3px rgba(45,45,45,.05)}
.nmhome-hero-copy h1{font-size:35px;line-height:1.12;margin:22px 0 0;max-width:16ch;font-weight:600}
@media(min-width:900px){.nmhome-hero-copy h1{font-size:54px;line-height:1.06;margin-top:24px}}
.nmhome-hl{color:var(--maroon);position:relative;white-space:nowrap}
.nmhome-hl:after{content:"";position:absolute;left:0;right:0;bottom:.02em;height:.13em;background:linear-gradient(90deg,var(--gold),#DcBd83);border-radius:3px;opacity:.5;z-index:-1}
.nmhome-lede{font-size:17px;line-height:1.7;color:var(--muted);margin:18px 0 0;max-width:40ch}
.nmhome-search{display:flex;align-items:center;gap:0;background:#fff;border:1px solid var(--line);border-radius:16px;padding:0 0 0 18px;margin-top:30px;box-shadow:0 6px 18px rgba(45,45,45,.06);transition:border-color .18s,box-shadow .18s;max-width:540px;height:56px}
.nmhome-search:focus-within{border-color:var(--maroon);box-shadow:0 0 0 4px rgba(122,36,52,.1),0 8px 22px rgba(122,36,52,.1)}
.nmhome-search-icon{color:var(--muted);display:flex;flex-shrink:0}
.nmhome-search input{flex:1;min-width:0;height:100%;border:none;outline:none;font-size:16px;color:var(--ink);background:transparent;font-family:inherit;padding:0 8px 0 12px}
.nmhome-search input::placeholder{color:#B7AEA4}
.nmhome-search button{flex-shrink:0;align-self:stretch;background:linear-gradient(140deg,#8A2A3C,#6E2030);color:#fff;border:none;border-radius:0 16px 16px 0;padding:0 26px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:filter .15s}
.nmhome-search button:hover{filter:brightness(1.08)}
.nmhome-search button:active{filter:brightness(.95)}
.nmhome-cta-row{display:flex;gap:12px;margin-top:18px}
.nmhome-cta-row>a{flex:1;max-width:230px}
.nmhome-btn-primary,.nmhome-btn-outline{display:flex;align-items:center;justify-content:center;height:54px;border-radius:15px;font-weight:600;font-size:15px;transition:transform .16s cubic-bezier(.22,.61,.36,1),box-shadow .16s,border-color .15s,color .15s}
.nmhome-btn-primary{background:linear-gradient(140deg,#8A2A3C,#6E2030);color:#fff!important;box-shadow:0 6px 18px rgba(122,36,52,.22)}
.nmhome-btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(122,36,52,.3)}
.nmhome-btn-primary:active{transform:translateY(0)}
.nmhome-btn-outline{background:#fff;color:var(--ink)!important;border:1.5px solid var(--line)}
.nmhome-btn-outline:hover{border-color:var(--maroon);color:var(--maroon)!important;transform:translateY(-2px);box-shadow:0 8px 18px rgba(45,45,45,.06)}
.nmhome-btn-outline:active{transform:translateY(0)}
.nmhome-chips-wrap{display:flex;flex-direction:column;gap:10px;margin-top:26px;min-width:0}
.nmhome-chips-label{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.nmhome-chips{display:flex;gap:9px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;padding-bottom:2px;-webkit-overflow-scrolling:touch;min-width:0}
.nmhome-chips::-webkit-scrollbar{display:none}
.nmhome-chips a{flex-shrink:0;background:#FCFAF6;border:1px solid var(--line);padding:7px 15px;border-radius:99px;font-size:13.5px;font-weight:500;color:var(--ink-2);white-space:nowrap;transition:transform .15s,border-color .15s,color .15s,background .15s}
.nmhome-chips a:hover{transform:scale(1.05);border-color:var(--gold);color:var(--maroon);background:#fff}

/* Preview card */
.nmhome-preview{position:relative;background:#fff;border:1px solid var(--line);border-radius:22px;padding:22px;box-shadow:0 2px 4px rgba(45,45,45,.03),0 24px 50px rgba(45,45,45,.09);transition:transform .25s cubic-bezier(.22,.61,.36,1),box-shadow .25s}
@media(min-width:900px){.nmhome-preview{transform:translateY(-4px)}.nmhome-preview:hover{transform:translateY(-8px);box-shadow:0 2px 4px rgba(45,45,45,.03),0 32px 64px rgba(45,45,45,.12)}}
.nmhome-preview-badge{position:absolute;top:18px;right:18px;background:var(--gold-bg);color:#9A7A2E;border:1px solid var(--gold-bd);font-size:11px;font-weight:700;letter-spacing:.02em;padding:5px 12px;border-radius:99px}
.nmhome-preview-head{padding-right:78px;padding-bottom:16px;border-bottom:1px solid #F3EEE4}
.nmhome-preview-place{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--maroon);text-transform:uppercase;letter-spacing:.05em}
.nmhome-preview-head strong{display:block;font-size:17px;margin-top:6px;color:var(--ink);font-weight:700;letter-spacing:-.01em}
.nmhome-preview-list{list-style:none;margin:0;padding:6px 0 4px;display:flex;flex-direction:column}
.nmhome-preview-list li{display:flex;align-items:center;gap:13px;padding:14px 0;border-bottom:1px solid #F5F1E9}
.nmhome-preview-list li:last-child{border-bottom:none}
.nmhome-preview-avatar{width:50px;height:50px;border-radius:15px;background:linear-gradient(135deg,#9A3143,#611B29);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;filter:blur(3.5px);flex-shrink:0}
.nmhome-preview-meta{flex:1;min-width:0}
.nmhome-preview-name{display:block;font-weight:700;font-size:14.5px;color:var(--ink-2);filter:blur(4px);user-select:none}
.nmhome-preview-sub{display:block;font-size:12.5px;color:var(--muted);margin-top:3px}
.nmhome-preview-tag{flex-shrink:0;font-size:11px;font-weight:600;color:#9A7A2E;background:var(--gold-bg);border:1px solid var(--gold-bd);padding:5px 10px;border-radius:99px;white-space:nowrap}
.nmhome-preview-cta{display:flex;align-items:center;justify-content:center;gap:6px;height:50px;margin-top:18px;border:1.5px solid var(--line);border-radius:14px;font-size:14.5px;font-weight:600;color:var(--maroon);transition:border-color .15s,background .15s,transform .15s}
.nmhome-preview-cta:hover{border-color:var(--maroon);background:#FCF7F1;transform:translateY(-1px)}
.nmhome-preview-note{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin:14px 0 0;justify-content:center}
.nmhome-preview-note svg{color:var(--maroon)}

/* Trust indicators */
.nmhome-trust{max-width:1160px;margin:28px auto 0;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(min-width:760px){.nmhome-trust{grid-template-columns:repeat(4,1fr);gap:16px;margin-top:44px}}
.nmhome-trust-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 1px 2px rgba(45,45,45,.03);transition:transform .18s cubic-bezier(.22,.61,.36,1),box-shadow .18s}
.nmhome-trust-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(45,45,45,.07)}
.nmhome-trust-icon{width:40px;height:40px;border-radius:12px;background:var(--gold-bg);color:var(--maroon);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.nmhome-trust-card strong{display:block;font-size:15px;color:var(--ink);font-weight:700;margin-bottom:5px}
.nmhome-trust-card p{font-size:13px;line-height:1.55;color:var(--muted);margin:0}

/* Social proof */
.nmhome-stats{max-width:1160px;margin:24px auto 0;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(min-width:760px){.nmhome-stats{grid-template-columns:repeat(4,1fr);gap:0;background:#fff;border:1px solid var(--line);border-radius:20px;padding:8px;box-shadow:0 2px 4px rgba(45,45,45,.03),0 16px 36px rgba(45,45,45,.06);margin-top:36px}}
.nmhome-stat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px 16px;text-align:center}
@media(min-width:760px){.nmhome-stat{border:none;border-radius:0;padding:26px 16px;position:relative}.nmhome-stat:not(:last-child):after{content:"";position:absolute;right:0;top:22%;height:56%;width:1px;background:var(--line)}}
.nmhome-stat strong{display:block;font-family:var(--font-playfair),Georgia,serif;font-size:30px;font-weight:700;color:var(--maroon);letter-spacing:-.01em}
.nmhome-stat span{display:block;font-size:12.5px;color:var(--muted);margin-top:6px;font-weight:500;line-height:1.4}

/* Conversion banner */
.nmhome-banner{max-width:1160px;margin:40px auto 0;padding:0 24px}
.nmhome-banner-in{background:linear-gradient(120deg,#FFFDF9,#F8F0DF);border:1px solid var(--gold-bd);border-radius:20px;padding:20px 22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;box-shadow:0 2px 4px rgba(45,45,45,.02)}
.nmhome-banner-star{width:46px;height:46px;border-radius:13px;background:#fff;border:1px solid var(--gold-bd);color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmhome-banner-in p{color:var(--ink-2);font-size:14.5px;margin:0;flex:1;min-width:210px;line-height:1.55}
.nmhome-banner-in p strong{color:var(--maroon);font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.nmhome-banner-in p b{color:var(--ink);font-weight:700}
.nmhome-banner-in a{background:linear-gradient(140deg,#8A2A3C,#6E2030);color:#fff!important;font-weight:600;font-size:14.5px;height:50px;padding:0 24px;border-radius:13px;white-space:nowrap;display:flex;align-items:center;box-shadow:0 5px 14px rgba(122,36,52,.2);transition:transform .16s,box-shadow .16s}
.nmhome-banner-in a:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(122,36,52,.28)}

/* Sections */
.nmhome-kicker{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin:0}
.nmhome-how{max-width:1160px;margin:0 auto;padding:76px 24px 8px;text-align:center}
.nmhome-how h2{font-size:31px;margin:10px 0 0}
.nmhome-how-grid{display:grid;gap:18px;margin-top:38px;text-align:left}
@media(min-width:760px){.nmhome-how-grid{grid-template-columns:repeat(3,1fr)}}
.nmhome-how-grid article{background:#fff;border:1px solid var(--line);border-radius:20px;padding:28px;box-shadow:0 1px 2px rgba(45,45,45,.03)}
.nmhome-how-grid article:hover{transform:translateY(-4px);box-shadow:0 16px 34px rgba(45,45,45,.08)}
.nmhome-how-icon{width:48px;height:48px;border-radius:14px;background:var(--gold-bg);color:var(--maroon);display:flex;align-items:center;justify-content:center}
.nmhome-how-grid strong{display:flex;align-items:center;gap:12px;font-size:17px;margin:20px 0 9px;color:var(--ink);font-weight:700}
.nmhome-how-grid strong em{width:27px;height:27px;border-radius:50%;background:var(--maroon);color:#fff;font-style:normal;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmhome-how-grid p{font-size:14.5px;line-height:1.7;color:var(--muted);margin:0}

.nmhome-places{max-width:1160px;margin:0 auto;padding:64px 24px 8px}
.nmhome-places-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:22px}
.nmhome-places-head h2{font-size:28px;margin:8px 0 0}
.nmhome-places-all{display:inline-flex;align-items:center;gap:5px;font-size:14px;font-weight:600;color:var(--maroon);white-space:nowrap;transition:gap .15s}
.nmhome-places-all:hover{gap:9px}
.nmhome-place-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(min-width:760px){.nmhome-place-grid{grid-template-columns:repeat(4,1fr)}}
.nmhome-place-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;transition:transform .18s cubic-bezier(.22,.61,.36,1),box-shadow .18s,border-color .15s;min-height:92px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 1px 2px rgba(45,45,45,.03)}
.nmhome-place-card:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(45,45,45,.09);border-color:var(--gold-bd)}
.nmhome-place-card strong{font-size:16px;color:var(--ink);font-weight:700}
.nmhome-place-card span{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;color:var(--maroon);font-weight:600;margin-top:8px}

.nmhome-final{max-width:1160px;margin:64px auto 72px;padding:0 24px}
.nmhome-final>div{background:linear-gradient(160deg,#FFFEFB,#F7F0E0);border:1px solid var(--gold-bd);border-radius:24px;padding:52px 26px;text-align:center;box-shadow:0 2px 6px rgba(45,45,45,.03)}
.nmhome-final h2{font-size:30px;max-width:18ch;margin:0 auto}
.nmhome-final p{font-size:15px;color:var(--muted);margin:16px auto 0;max-width:52ch;line-height:1.6}
.nmhome-cta-center{justify-content:center;margin-top:28px}
.nmhome-cta-center>a{flex:0 1 210px}
`
