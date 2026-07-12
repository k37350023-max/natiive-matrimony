import Link from 'next/link'
import BrandLogo from './components/BrandLogo'
import { slugify } from '@/lib/nativePlaces'

const popularPlaces = ['Hyderabad', 'Warangal', 'Guntur', 'Nellore', 'Vijayawada', 'Karimnagar', 'Rajahmundry', 'Mysore']

const steps = [
  ['Choose your native place', 'Search by village, town, district, or city.', 'pin'],
  ['Create your profile', 'Start with basics. Add more details when ready.', 'card'],
  ['Get notified and connect', 'We alert you when matching families join.', 'bell'],
]

const stats = [
  ['1,000', '2-year Premium spots per district'],
  ['Free', 'profile creation and place alerts'],
  ['Private', 'contact after connection'],
  ['30 sec', 'to start your profile'],
]

const trustItems = [
  ['Verified profiles', 'Phone verification and approval flow for serious families.', 'shield'],
  ['Privacy first', 'Contact details are shared only after both sides connect.', 'lock'],
  ['Built for families', 'Designed around native place, parents, and serious review.', 'family'],
  ['Native place first', 'Because hometown roots matter in every search.', 'map'],
]

const regions = [
  ['Telangana', 'Hyderabad, Warangal, Karimnagar', '#EAF5EA'],
  ['Coastal Andhra', 'Guntur, Vijayawada, Rajahmundry', '#EEF6FA'],
  ['Rayalaseema', 'Tirupati, Kurnool, Kadapa', '#F8F1E4'],
  ['All India', 'Search by roots across states', '#F1F3EA'],
]

const previewPlaces = [
  ['Hyderabad', '42 active profiles'],
  ['Guntur', '28 active profiles'],
  ['Warangal', '19 active profiles'],
  ['Nellore', 'New alerts open'],
]

const navItems = [
  ['/', 'Home', 'home'],
  ['/browse', 'Browse', 'search'],
  ['/native', 'Places', 'map'],
  ['/pricing', 'Pricing', 'shield'],
  ['/login', 'Login', 'user'],
]

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
    card: 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',
    check: 'M20 6 9 17l-5-5',
    family: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
    home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    lock: 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v10H5z',
    map: 'M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z M9 3v15 M15 6v15',
    pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    search: 'm21 21-4.35-4.35 M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.check} />
    </svg>
  )
}

function DirectoryPreview() {
  return (
    <aside className="nmh-directory-preview" aria-label="NativeMatrimony preview">
      <div className="nmh-preview-top">
        <span><Icon name="shield" size={22} /></span>
        <div>
          <p>Private until connected</p>
          <strong>Browse real profiles by native place</strong>
        </div>
      </div>
      <div className="nmh-preview-search">
        <Icon name="search" size={18} />
        <span>Search Guntur, Warangal, Nellore...</span>
      </div>
      <div className="nmh-preview-profile">
        <div className="nmh-preview-avatar">AR</div>
        <div>
          <strong>Ananya R.</strong>
          <p>29 yrs · Product Manager</p>
          <p>Native place: Guntur</p>
        </div>
        <span>Verified</span>
      </div>
      <div className="nmh-preview-grid">
        {previewPlaces.map(([place, count]) => (
          <Link key={place} href={`/native/${slugify(place)}`}>
            <strong>{place}</strong>
            <span>{count}</span>
          </Link>
        ))}
      </div>
      <div className="nmh-preview-steps">
        <p><Icon name="check" size={16} /> Create profile</p>
        <p><Icon name="check" size={16} /> Browse native places</p>
        <p><Icon name="check" size={16} /> Connect when both sides agree</p>
      </div>
    </aside>
  )
}

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'NativeMatrimony',
      url: 'https://nativematrimony.com',
      description: 'Native-place-first marriage discovery. Search by native place, set free alerts, and connect only on mutual interest.',
    },
    {
      '@type': 'WebSite',
      name: 'NativeMatrimony',
      url: 'https://nativematrimony.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://nativematrimony.com/browse?native_place={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function Home() {
  return (
    <main className="nmh-page nmh-directory-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <div className="nmh-shell">
        <header className="nmh-header">
          <BrandLogo className="app-brand-home" />
          <nav className="nmh-desktop-nav" aria-label="Main navigation">
            <Link href="/browse">Browse Profiles</Link>
            <Link href="/native">Native Places</Link>
            <Link href="#how-it-works">How It Works</Link>
            <Link href="/pricing">Membership</Link>
            <Link href="/login">Login</Link>
            <Link href="/register" className="nmh-nav-cta">Create Profile</Link>
          </nav>
          <div className="nmh-mobile-actions">
            <Link href="/login" className="nmh-mobile-login">Login</Link>
            <Link href="/register" className="nmh-menu" aria-label="Create profile">
              <Icon name="user" size={22} />
            </Link>
          </div>
        </header>

        <section className="nmh-hero nmh-directory-hero">
          <div className="nmh-hero-copy">
            <h1>Meet families who care about your native place.</h1>
            <p>Create a profile, choose your native place, browse serious families, and connect when interest is mutual.</p>
            <div className="nmh-proof-row" aria-label="Trust highlights">
              <span><Icon name="shield" size={15} />100% verified</span>
              <span><Icon name="lock" size={15} />Privacy first</span>
              <span><Icon name="family" size={15} />Family friendly</span>
            </div>
            <section className="nmh-search-panel nmh-hero-search" aria-labelledby="native-search-heading">
              <div>
                <h2 id="native-search-heading">Start with your native place</h2>
                <p className="nmh-search-sub">This is the first step to finding the right family.</p>
              </div>
              <form action="/browse" className="nmh-search-form">
                <input name="native_place" placeholder="Search by native place, city, or district" aria-label="Native place" />
                <button type="submit">Search</button>
              </form>
              <div>
                <p className="nmh-popular-label">Popular native places</p>
                <div className="nmh-place-row" aria-label="Popular native place searches">
                  {popularPlaces.map((place) => (
                    <Link key={place} href={`/native/${slugify(place)}`}>{place}</Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
          <DirectoryPreview />
        </section>

        <section id="how-it-works" className="nmh-how-band">
          <h2>How it works</h2>
          <div className="nmh-how-grid">
            {steps.map(([title, body, icon], index) => (
              <article key={title}>
                <span><Icon name={icon} size={26} /></span>
                <div>
                  <strong>{index + 1}. {title}</strong>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="nmh-stats-trust">
          <div className="nmh-stat-row" aria-label="Launch trust numbers">
            {stats.map(([value, label]) => (
              <article key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
          <div className="nmh-trust-row">
            <h2>Why families trust Native Matrimony</h2>
            <div>
              {trustItems.map(([title, body, icon]) => (
                <article key={title}>
                  <span><Icon name={icon} size={22} /></span>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="nmh-section nmh-region-section">
          <div className="nmh-section-heading">
            <p className="nmh-section-kicker">Browse by roots</p>
            <h2>Explore active native-place regions.</h2>
          </div>
          <div className="nmh-region-grid">
            {regions.map(([region, body, bg]) => (
              <Link key={region} href={`/browse?native_place=${encodeURIComponent(region)}`} className="nmh-region-card" style={{ background: bg }}>
                <div className="nmh-region-art" aria-hidden="true"><span /></div>
                <div>
                  <h3>{region}</h3>
                  <p>{body}</p>
                </div>
                <span className="nmh-region-arrow" aria-hidden="true">&gt;</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="nmh-final nmh-directory-final">
          <div>
            <p className="nmh-section-kicker">Create once. Get notified.</p>
            <h2>Be visible when the right family searches your place.</h2>
            <p>The free version stays free. First 1,000 profiles per district get 2 years Premium.</p>
          </div>
          <div className="nmh-actions">
            <Link href="/register" className="nmh-primary">Create Your Profile</Link>
            <Link href="/browse" className="nmh-secondary">Browse Profiles</Link>
          </div>
        </section>
      </div>

      <nav className="nmh-mobile-nav" aria-label="Mobile navigation">
        {navItems.map(([href, label, icon]) => (
          <Link href={href} key={label} className={label === 'Home' ? 'active' : ''}>
            <Icon name={icon} size={21} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}
