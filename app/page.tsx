import Link from 'next/link'
import { slugify } from '@/lib/nativePlaces'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 600

const popularPlaces = ['Hyderabad', 'Guntur', 'Warangal', 'Nellore', 'Vijayawada', 'Karimnagar', 'Rajahmundry', 'Tirupati', 'Kadapa', 'Khammam']

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
    <aside className="nmhome-preview" aria-label={`${place} profiles preview`}>
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

  return (
    <main className="nmhome">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="nmhome-header">
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
            <span className="nmhome-eyebrow"><Icon name="pin" size={13} /> Native-place-first matrimony</span>
            <h1>Find serious matches from your <span className="nmhome-hl">native place</span></h1>
            <p className="nmhome-lede">Browse verified families who share your roots. Connect only when the interest is mutual.</p>

            <form action="/browse" className="nmhome-search" role="search">
              <span className="nmhome-search-icon"><Icon name="search" size={20} /></span>
              <input name="native_place" placeholder="Search your hometown..." aria-label="Search by native place" autoComplete="off" />
              <button type="submit" aria-label="Search native place">Search</button>
            </form>

            <div className="nmhome-cta-row">
              <Link href="/register" className="nmhome-btn-primary">Create Free Profile</Link>
              <Link href="/browse" className="nmhome-btn-outline">Browse Profiles</Link>
            </div>

            <div className="nmhome-chips-wrap">
              <span className="nmhome-chips-label">Popular</span>
              <div className="nmhome-chips" aria-label="Popular native places">
                {popularPlaces.map(p => (
                  <Link key={p} href={`/browse?native_place=${encodeURIComponent(p)}`}>{p}</Link>
                ))}
              </div>
            </div>
          </div>

          <PreviewCard place={featured} count={featuredCount} />
        </div>
      </section>

      {/* Trust strip */}
      <section className="nmhome-trust" aria-label="Why families trust us">
        {trust.map(([label, icon]) => (
          <div key={label}><span><Icon name={icon} size={17} /></span>{label}</div>
        ))}
      </section>

      {/* Conversion banner */}
      <section className="nmhome-banner">
        <div className="nmhome-banner-in">
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
          <Link href="/native" className="nmhome-places-all">All native places <Icon name="arrow" size={15} /></Link>
        </div>
        <div className="nmhome-place-grid">
          {popularPlaces.slice(0, 8).map(p => (
            <Link key={p} href={`/native/${slugify(p)}`} className="nmhome-place-card">
              <strong>{p}</strong>
              <span>View profiles <Icon name="arrow" size={13} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="nmhome-final">
        <div>
          <h2>Be found when the right family searches your place.</h2>
          <p>Free to start · {total > 0 ? `${total.toLocaleString()} verified profiles and growing` : 'A growing community of serious families'} · Private until you connect.</p>
          <div className="nmhome-cta-row nmhome-cta-center">
            <Link href="/register" className="nmhome-btn-primary">Create Free Profile</Link>
            <Link href="/browse" className="nmhome-btn-outline">Browse Profiles</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

const CSS = `
.nmhome{--cream:#FBF8F3;--card:#FFFFFF;--maroon:#7A1E29;--maroon-d:#611620;--gold:#B98C46;--ink:#26201C;--ink-2:#4A423C;--muted:#7C726A;--line:#ECE4D8;--r:16px;background:var(--cream);color:var(--ink);font-family:var(--font-inter),system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.nmhome *{box-sizing:border-box}
.nmhome a{text-decoration:none;color:inherit}
.nmhome h1,.nmhome h2{font-family:var(--font-playfair),Georgia,serif;letter-spacing:-.01em;margin:0;color:var(--ink)}
.nmhome a:focus-visible,.nmhome button:focus-visible,.nmhome input:focus-visible{outline:2px solid var(--maroon);outline-offset:2px;border-radius:8px}

/* Header */
.nmhome-header{position:sticky;top:0;z-index:40;background:rgba(251,248,243,.82);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.nmhome-header-in{max-width:1140px;margin:0 auto;padding:0 20px;height:56px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nmhome-brand{display:flex;align-items:center;gap:9px}
.nmhome-brand-mark{width:28px;height:28px;border-radius:8px;background:linear-gradient(150deg,#7A1E29,#611620);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(97,22,32,.22)}
.nmhome-brand-text{font-family:var(--font-playfair),Georgia,serif;font-size:18px;color:var(--ink);letter-spacing:-.01em}
.nmhome-brand-text b{color:var(--maroon);font-weight:700}
.nmhome-nav{display:none;align-items:center;gap:22px;font-size:14px;font-weight:500;color:var(--ink-2)}
.nmhome-nav a{transition:color .15s}
.nmhome-nav a:hover{color:var(--maroon)}
.nmhome-nav-login{color:var(--ink)}
.nmhome-nav-cta{background:var(--maroon);color:#fff!important;padding:9px 16px;border-radius:10px;font-weight:600;transition:background .15s,transform .1s}
.nmhome-nav-cta:hover{background:var(--maroon-d)}
.nmhome-nav-cta:active{transform:scale(.97)}
.nmhome-header-mobile{display:flex;align-items:center;gap:8px}
.nmhome-mlogin{font-size:14px;font-weight:600;color:var(--ink-2);padding:10px 8px;min-height:44px;display:flex;align-items:center}
.nmhome-mcreate{background:var(--maroon);color:#fff!important;padding:0 16px;height:40px;display:flex;align-items:center;border-radius:10px;font-weight:600;font-size:14px}
.nmhome-mcreate:active{transform:scale(.97)}
@media(min-width:900px){.nmhome-nav{display:flex}.nmhome-header-mobile{display:none}}

/* Hero */
.nmhome-hero{padding:40px 20px 12px;position:relative;overflow:hidden;background:radial-gradient(130% 80% at 90% -20%,#F6EAD6 0%,rgba(246,234,214,0) 52%),radial-gradient(90% 60% at -10% 8%,#F6E9E5 0%,rgba(246,233,229,0) 46%)}
.nmhome-hero-in{max-width:1140px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:28px;align-items:center}
.nmhome-hero-copy{min-width:0}
@media(min-width:900px){.nmhome-hero{padding:64px 20px 28px}.nmhome-hero-in{grid-template-columns:minmax(0,1.06fr) minmax(0,.94fr);gap:52px}}
.nmhome-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--maroon);background:#fff;border:1px solid var(--line);padding:6px 13px;border-radius:99px;box-shadow:0 1px 2px rgba(38,32,28,.04)}
.nmhome-hero-copy h1{font-size:33px;line-height:1.14;margin:18px 0 0;max-width:15ch;font-weight:600}
@media(min-width:900px){.nmhome-hero-copy h1{font-size:50px;line-height:1.08}}
.nmhome-hl{color:var(--maroon);position:relative;white-space:nowrap}
.nmhome-hl:after{content:"";position:absolute;left:0;right:0;bottom:.02em;height:.14em;background:linear-gradient(90deg,var(--gold),#D8B978);border-radius:3px;opacity:.5;z-index:-1}
.nmhome-lede{font-size:16.5px;line-height:1.65;color:var(--muted);margin:16px 0 0;max-width:44ch}
.nmhome-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:6px 6px 6px 16px;margin-top:26px;box-shadow:0 4px 14px rgba(38,32,28,.05);transition:border-color .15s,box-shadow .15s;max-width:520px}
.nmhome-search:focus-within{border-color:var(--maroon);box-shadow:0 0 0 3px rgba(122,30,41,.1)}
.nmhome-search-icon{color:var(--muted);display:flex;flex-shrink:0}
.nmhome-search input{flex:1;min-width:0;height:44px;border:none;outline:none;font-size:16px;color:var(--ink);background:transparent;font-family:inherit}
.nmhome-search input::placeholder{color:#B7AEA4}
.nmhome-search button{flex-shrink:0;background:var(--maroon);color:#fff;border:none;border-radius:10px;height:44px;padding:0 20px;font-size:14.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s,transform .1s}
.nmhome-search button:hover{background:var(--maroon-d)}
.nmhome-search button:active{transform:scale(.97)}
.nmhome-cta-row{display:flex;gap:12px;margin-top:16px}
.nmhome-cta-row>a{flex:1;max-width:220px}
.nmhome-btn-primary,.nmhome-btn-outline{display:flex;align-items:center;justify-content:center;height:52px;border-radius:14px;font-weight:600;font-size:15px;transition:background .15s,transform .1s,box-shadow .15s}
.nmhome-btn-primary{background:var(--maroon);color:#fff!important;box-shadow:0 6px 16px rgba(122,30,41,.18)}
.nmhome-btn-primary:hover{background:var(--maroon-d)}
.nmhome-btn-primary:active,.nmhome-btn-outline:active{transform:scale(.98)}
.nmhome-btn-outline{background:#fff;color:var(--ink)!important;border:1.5px solid var(--line)}
.nmhome-btn-outline:hover{border-color:var(--maroon);color:var(--maroon)!important}
.nmhome-chips-wrap{display:flex;align-items:center;gap:10px;margin-top:22px;min-width:0}
.nmhome-chips-label{font-size:12.5px;font-weight:600;color:var(--muted);flex-shrink:0}
.nmhome-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;padding-bottom:2px;-webkit-overflow-scrolling:touch;min-width:0;flex:1}
.nmhome-chips::-webkit-scrollbar{display:none}
.nmhome-chips a{flex-shrink:0;background:#fff;border:1px solid var(--line);padding:8px 14px;border-radius:99px;font-size:13.5px;font-weight:500;color:var(--ink-2);white-space:nowrap;transition:border-color .15s,color .15s,background .15s}
.nmhome-chips a:hover{border-color:var(--gold);color:var(--maroon);background:#FCF8F1}

/* Preview card */
.nmhome-preview{position:relative;background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 1px 2px rgba(38,32,28,.04),0 18px 40px rgba(38,32,28,.08)}
.nmhome-preview-badge{position:absolute;top:16px;right:16px;background:#FBF2E2;color:#9A7A2E;border:1px solid #EBD9B5;font-size:11px;font-weight:700;padding:4px 11px;border-radius:99px}
.nmhome-preview-head{padding-right:70px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.nmhome-preview-place{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--maroon);text-transform:uppercase;letter-spacing:.04em}
.nmhome-preview-head strong{display:block;font-size:16px;margin-top:5px;color:var(--ink);font-weight:700}
.nmhome-preview-list{list-style:none;margin:0;padding:14px 0 4px;display:flex;flex-direction:column;gap:12px}
.nmhome-preview-list li{display:flex;align-items:center;gap:12px}
.nmhome-preview-avatar{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#8A2432,#611620);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;filter:blur(3px);flex-shrink:0}
.nmhome-preview-meta{flex:1;min-width:0}
.nmhome-preview-name{display:block;font-weight:700;font-size:14px;color:var(--ink-2);filter:blur(3.5px);user-select:none}
.nmhome-preview-sub{display:block;font-size:12.5px;color:var(--muted);margin-top:3px}
.nmhome-preview-tag{flex-shrink:0;font-size:11px;font-weight:600;color:var(--gold);background:#FBF4E7;border:1px solid #EEDFC0;padding:4px 9px;border-radius:99px;white-space:nowrap}
.nmhome-preview-cta{display:flex;align-items:center;justify-content:center;gap:6px;height:48px;margin-top:16px;border:1.5px solid var(--line);border-radius:12px;font-size:14px;font-weight:600;color:var(--maroon);transition:border-color .15s,background .15s}
.nmhome-preview-cta:hover{border-color:var(--maroon);background:#FCF8F1}
.nmhome-preview-note{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin:12px 0 0;justify-content:center}
.nmhome-preview-note svg{color:var(--maroon)}

/* Trust strip */
.nmhome-trust{max-width:1140px;margin:16px auto 0;padding:0 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(min-width:760px){.nmhome-trust{grid-template-columns:repeat(4,1fr)}}
.nmhome-trust>div{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;font-size:13.5px;font-weight:600;color:var(--ink-2);min-height:56px}
.nmhome-trust>div span{width:34px;height:34px;border-radius:10px;background:#FBF2E7;color:var(--maroon);display:flex;align-items:center;justify-content:center;flex-shrink:0}

/* Conversion banner */
.nmhome-banner{max-width:1140px;margin:32px auto 0;padding:0 20px}
.nmhome-banner-in{background:linear-gradient(120deg,#FFFDF9,#F8EFDD);border:1px solid #EBD9B5;border-radius:18px;padding:18px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.nmhome-banner-star{width:44px;height:44px;border-radius:12px;background:#fff;border:1px solid #EEDFC0;color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmhome-banner-in p{color:var(--ink-2);font-size:14px;margin:0;flex:1;min-width:200px;line-height:1.5}
.nmhome-banner-in p strong{color:var(--maroon);font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
.nmhome-banner-in p b{color:var(--ink);font-weight:700}
.nmhome-banner-in a{background:var(--maroon);color:#fff!important;font-weight:600;font-size:14px;height:48px;padding:0 22px;border-radius:12px;white-space:nowrap;display:flex;align-items:center;transition:background .15s,transform .1s}
.nmhome-banner-in a:hover{background:var(--maroon-d)}
.nmhome-banner-in a:active{transform:scale(.98)}

/* Kicker + sections */
.nmhome-kicker{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--gold);margin:0}
.nmhome-how{max-width:1140px;margin:0 auto;padding:64px 20px 8px;text-align:center}
.nmhome-how h2{font-size:29px;margin:8px 0 0}
.nmhome-how-grid{display:grid;gap:16px;margin-top:32px;text-align:left}
@media(min-width:760px){.nmhome-how-grid{grid-template-columns:repeat(3,1fr)}}
.nmhome-how-grid article{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;transition:transform .15s,box-shadow .15s}
.nmhome-how-grid article:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(38,32,28,.07)}
.nmhome-how-icon{width:46px;height:46px;border-radius:13px;background:#FBF2E7;color:var(--maroon);display:flex;align-items:center;justify-content:center}
.nmhome-how-grid strong{display:flex;align-items:center;gap:11px;font-size:16.5px;margin:18px 0 8px;color:var(--ink);font-weight:700}
.nmhome-how-grid strong em{width:26px;height:26px;border-radius:50%;background:var(--maroon);color:#fff;font-style:normal;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nmhome-how-grid p{font-size:14.5px;line-height:1.65;color:var(--muted);margin:0}

.nmhome-places{max-width:1140px;margin:0 auto;padding:56px 20px 8px}
.nmhome-places-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:20px}
.nmhome-places-head h2{font-size:27px;margin:6px 0 0}
.nmhome-places-all{display:inline-flex;align-items:center;gap:5px;font-size:14px;font-weight:600;color:var(--maroon);white-space:nowrap}
.nmhome-place-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(min-width:760px){.nmhome-place-grid{grid-template-columns:repeat(4,1fr)}}
.nmhome-place-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;transition:transform .15s,box-shadow .15s,border-color .15s;min-height:88px;display:flex;flex-direction:column;justify-content:center}
.nmhome-place-card:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(38,32,28,.08);border-color:#E2D3BE}
.nmhome-place-card strong{font-size:16px;color:var(--ink);font-weight:700}
.nmhome-place-card span{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;color:var(--maroon);font-weight:600;margin-top:7px}

.nmhome-final{max-width:1140px;margin:56px auto 64px;padding:0 20px}
.nmhome-final>div{background:linear-gradient(160deg,#FFFEFB,#F7EFDF);border:1px solid #EBD9B5;border-radius:22px;padding:44px 26px;text-align:center}
.nmhome-final h2{font-size:28px;max-width:18ch;margin:0 auto}
.nmhome-final p{font-size:14.5px;color:var(--muted);margin:14px auto 0;max-width:52ch}
.nmhome-cta-center{justify-content:center;margin-top:24px}
.nmhome-cta-center>a{flex:0 1 200px}
`
