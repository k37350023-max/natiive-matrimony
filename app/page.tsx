import Link from 'next/link'

const TRUST_BADGES = [
  ['Free', 'Forever', 'M5 13l4 4L19 7'],
  ['Photos', 'Private', 'M6 10V8a6 6 0 0 1 12 0v2'],
  ['No Random', 'Messages', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  ['Parent', 'Friendly', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'],
  ['Verified', 'Profiles', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
]

const POPULAR_PLACES = ['Karimnagar', 'Warangal', 'Guntur', 'Nellore', 'Rajahmundry', 'Nizamabad', 'Vijayawada', 'Vizag']

const FEATURES = [
  ['Native Place First', 'Find people who share your hometown, roots, and cultural background.', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  ['Photos Private', 'Photos become visible only after mutual interest.', 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v10H5z'],
  ['No Random Messaging', 'Conversations start only after both families express interest.', 'M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  ['Parent Friendly', 'Parents can create and manage profiles easily.', 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M20 21v-2a4 4 0 0 0-3-3.87'],
  ['Free Forever', 'No subscriptions. No hidden charges. Always free.', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z'],
]

const STEPS = [
  ['Create Profile', 'Add your details in under 2 minutes.', 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  ['Select Native Place', 'Choose your hometown, district, or region.', 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z'],
  ['Find Matches', 'Browse people who share your roots and preferences.', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87'],
  ['Mutual Interest', 'Connect only when both sides are interested.', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z'],
  ['Family Conversation', 'Start discussions with confidence.', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
]

const REGIONS: Array<[string, string[]]> = [
  ['Telangana', ['Karimnagar', 'Warangal', 'Nizamabad', 'Khammam', 'Adilabad', 'Mahabubnagar']],
  ['Andhra Pradesh', ['Guntur', 'Nellore', 'Rajahmundry', 'Kakinada', 'Vijayawada', 'Tirupati']],
]

function Icon({ path, size = 24 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function Logo() {
  return (
    <Link href="/" className="home-logo" aria-label="NativeMatrimony home">
      <span>native</span>
      <span>matrimony</span>
      <small>Your hometown. Your roots. Your match.</small>
    </Link>
  )
}

function HeroIllustration() {
  return (
    <div className="hero-art" aria-label="Private native-place registry preview">
      <div className="hero-map">
        <span className="hero-map-pin" />
        <span className="hero-map-line one" />
        <span className="hero-map-line two" />
        <span className="hero-map-line three" />
      </div>
      <div className="hero-profile-card primary">
        <div className="profile-photo locked">
          <Icon path="M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v10H5z" size={26} />
        </div>
        <div className="profile-lines">
          <strong>Profile locked</strong>
          <span>Age • Occupation</span>
          <span>Native place visible</span>
        </div>
      </div>
      <div className="hero-profile-card secondary">
        <div>
          <small>Native Place</small>
          <strong>Karimnagar</strong>
        </div>
        <span className="match-pill">Private until accepted</span>
      </div>
      <div className="hero-profile-card tertiary">
        <Icon path="M20 6 9 17l-5-5" size={18} />
        <span>Biodata unlocks after mutual interest</span>
      </div>
    </div>
  )
}

function TempleThumb() {
  return (
    <svg viewBox="0 0 110 92" className="place-temple" aria-hidden="true">
      <rect width="110" height="92" rx="18" fill="#F6E7C3" />
      <path d="M24 78h62V43H24z" fill="#E1A456" />
      <path d="M17 43 55 14l38 29z" fill="#C77D36" />
      <path d="M34 78V58c0-11 9-20 21-20s21 9 21 20v20" fill="#FFF4DC" />
      <path d="M35 47h40M28 57h54M24 69h62" stroke="#8D5E2E" strokeWidth="4" strokeLinecap="round" opacity=".45" />
    </svg>
  )
}

function ConsultantPortrait() {
  return (
    <svg viewBox="0 0 150 180" className="consultant-portrait" aria-hidden="true">
      <rect width="150" height="180" rx="28" fill="#F8E6C8" />
      <circle cx="76" cy="50" r="30" fill="#A96A45" />
      <path d="M47 49c11-32 52-31 61 3-16-13-38-13-61-3z" fill="#241611" />
      <path d="M45 166c5-50 27-78 62-78 30 0 48 29 53 78z" fill="#FDF2DF" />
      <path d="M41 115c27 18 62 18 90 0" stroke="#E0BE8C" strokeWidth="9" strokeLinecap="round" />
      <path d="M62 58c8 9 20 9 28 0" stroke="#6B3A29" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export default function Home() {
  return (
    <main className="landing-page">
      <div className="landing-shell">
        <header className="landing-header">
          <Logo />
          <Link href="/login" className="landing-menu" aria-label="Open menu">
            <span />
            <span />
            <span />
          </Link>
        </header>

        <section className="hero-section">
          <div className="hero-copy">
            <h1>Find your life partner from your <span>native place.</span></h1>
            <p>Someone who understands your roots, family, traditions, and values.</p>
            <div className="trust-row">
              {TRUST_BADGES.map(([top, bottom, icon]) => (
                <div className="trust-badge" key={top}>
                  <span><Icon path={icon} size={16} /></span>
                  <strong>{top}</strong>
                  <small>{bottom}</small>
                </div>
              ))}
            </div>
            <div className="hero-actions">
              <Link href="/register" className="landing-primary">
                <Icon path="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 7a4 4 0 1 0 0 .01 M20 8v6 M23 11h-6" size={20} />
                <span>Create Free Profile</span>
                <small>Takes less than 2 minutes</small>
              </Link>
              <Link href="/browse" className="landing-secondary">
                <Icon path="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 7a4 4 0 1 0 0 .01 M20 8v6 M23 11h-6" size={20} />
                Browse Profiles
              </Link>
            </div>
            <div className="hero-privacy-note">
              <Icon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={17} />
              Biodata and contact unlock only after acceptance.
            </div>
          </div>

          <div className="hero-visual-wrap">
            <HeroIllustration />
          </div>
        </section>

        <section className="search-card">
          <h2><Icon path="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" size={22} />Search by Native Place</h2>
          <form action="/browse" className="native-search-form">
            <input name="native_place" placeholder="Enter village, town, district, or city" aria-label="Native place" />
            <button type="submit" aria-label="Search native place"><Icon path="m21 21-4.35-4.35 M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" size={25} /></button>
          </form>
          <p>Popular searches:</p>
          <div className="place-chip-grid">
            {POPULAR_PLACES.map(place => (
              <Link key={place} href={`/browse?native_place=${encodeURIComponent(place)}`}>{place}</Link>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h2>Why Families Choose <span>NativeMatrimony</span></h2>
          <div className="feature-grid">
            {FEATURES.map(([title, body, icon]) => (
              <article key={title} className="feature-card">
                <Icon path={icon} size={42} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h2>How It Works</h2>
          <div className="steps-card">
            {STEPS.map(([title, body, icon], index) => (
              <article key={title} className="step-item">
                <span className="step-num">{index + 1}</span>
                <Icon path={icon} size={44} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h2>Featured Native Places</h2>
          <div className="native-place-cards">
            {REGIONS.map(([region, places]) => (
              <article className="native-region-card" key={region}>
                <TempleThumb />
                <div>
                  <h3>{region}</h3>
                  <div className="region-chip-grid">
                    {places.map(place => (
                      <Link href={`/browse?native_place=${encodeURIComponent(place)}`} key={place}>{place}</Link>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Link href="/search" className="view-all-link">View All Native Places <span>→</span></Link>
        </section>

        <section className="consultant-card">
          <ConsultantPortrait />
          <div className="consultant-copy">
            <h2>Need Personalized Matchmaking?</h2>
            <p>Connect with Verified Local Matrimony Consultants</p>
            {['Verified by NativeMatrimony', 'Local community expertise', 'Personalized matchmaking', 'Optional service'].map(item => (
              <div className="consultant-bullet" key={item}>
                <Icon path="M20 6 9 17l-5-5" size={14} />
                {item}
              </div>
            ))}
          </div>
          <div className="consultant-actions">
            <Link href="/consultants" className="landing-primary compact">View Consultants</Link>
            <span>Verified Local Consultants</span>
          </div>
        </section>

        <section className="bottom-cta">
          <div className="tree-art" aria-hidden="true">
            <svg viewBox="0 0 170 110">
              <rect width="170" height="110" rx="22" fill="#FFF4D8" />
              <path d="M0 91c38-16 85-15 170 2v17H0z" fill="#EADBA9" />
              <path d="M77 92V51" stroke="#795E36" strokeWidth="8" strokeLinecap="round" />
              <circle cx="77" cy="38" r="35" fill="#A4C17E" />
              <circle cx="47" cy="51" r="24" fill="#8EAF70" />
              <circle cx="106" cy="54" r="25" fill="#7FA464" />
              <path d="M111 87h38" stroke="#7A5F3C" strokeWidth="5" strokeLinecap="round" />
              <path d="M121 86v11M145 86v11" stroke="#7A5F3C" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Ready to find someone who understands your roots?</h2>
          <div>
            <Link href="/register" className="landing-primary compact">Create Free Profile</Link>
            <Link href="/browse" className="landing-secondary compact">Browse Profiles</Link>
          </div>
        </section>
      </div>

      <nav className="landing-mobile-nav" aria-label="Mobile navigation">
        {[
          ['/', 'Home', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
          ['/search', 'Search', 'm21 21-4.35-4.35 M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z'],
          ['/interests', 'Interests', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z'],
          ['/matches', 'Chats', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
          ['/dashboard', 'Profile', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
        ].map(([href, label, icon]) => (
          <Link href={href} key={label} className={label === 'Home' ? 'active' : ''}>
            <Icon path={icon} size={22} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}
