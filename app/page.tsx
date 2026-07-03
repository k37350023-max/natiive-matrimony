import Image from 'next/image'
import Link from 'next/link'
import BrandLogo from './components/BrandLogo'

const popularPlaces = ['Karimnagar', 'Warangal', 'Guntur', 'Nellore', 'Rajahmundry', 'Nizamabad', 'Vijayawada', 'Vizag']

const trustItems = [
  ['Native-place first', 'Focused on families who care about roots, hometowns, and serious introductions.', 'pin'],
  ['Useful before unlock', 'Photos and key profile signals stay visible so the registry feels alive.', 'check'],
  ['No Random Messages', 'Chat starts only when both sides accept.', 'chat'],
  ['Family Friendly', 'Built around native place, parents, and serious family review.', 'family'],
  ['Verified Profiles', 'Phone verification, approval flow, and optional manual review.', 'shield'],
]

const journey = [
  ['Create your profile', 'Add native place, work, education, photo preference, and contact verification.'],
  ['Join the native registry', 'Your profile becomes discoverable to families searching by roots and location.'],
  ['Send or accept interest', 'Both families choose before biodata and contact unlock.'],
  ['Talk with confidence', 'Accepted connections can continue with profile, chat, and contact.'],
]

const regions: Array<[string, string[]]> = [
  ['Telangana', ['Karimnagar', 'Warangal', 'Nizamabad', 'Khammam', 'Adilabad', 'Mahabubnagar']],
  ['Andhra Pradesh', ['Guntur', 'Nellore', 'Rajahmundry', 'Kakinada', 'Vijayawada', 'Tirupati']],
]

const profilePreview = [
  ['Roots', 'Karimnagar'],
  ['Signal', 'Engineer in Austin'],
  ['Contact', 'Locked until accepted'],
]

const navItems = [
  ['/', 'Home', 'home'],
  ['/browse', 'Browse', 'search'],
  ['/interests', 'Requests', 'heart'],
  ['/matches', 'Chats', 'chat'],
  ['/dashboard', 'Profile', 'user'],
]

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    check: 'M20 6 9 17l-5-5',
    lock: 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v10H5z',
    chat: 'M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    family: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z',
    search: 'm21 21-4.35-4.35 M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
    briefcase: 'M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1 M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z M3 13h18',
    card: 'M3 6h18v12H3z M3 10h18 M7 15h4',
    home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    arrow: 'M5 12h14 M13 5l7 7-7 7',
    sparkle: 'M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3z M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z',
    upload: 'M12 16V4 M7 9l5-5 5 5 M4 20h16',
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.check} />
    </svg>
  )
}

function Logo() {
  return <BrandLogo className="app-brand-home" />
}

function HeroVisual() {
  return (
    <div className="nmh-hero-visual" aria-label="Matrimonial profile preview">
      <Image
        src="/home-hero-match.webp"
        alt=""
        width={1672}
        height={941}
        priority
        sizes="(min-width: 960px) 520px, 100vw"
        className="nmh-hero-image"
      />
      <div className="nmh-profile-panel">
        <div className="nmh-panel-top">
          <span className="nmh-avatar-lock"><Icon name="shield" size={21} /></span>
          <div>
            <p>Verified preview</p>
            <strong>Private details unlock after acceptance</strong>
          </div>
        </div>
        <div className="nmh-preview-list">
          {profilePreview.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="nmh-match-chip">
        <Icon name="sparkle" size={17} />
        Serious profiles, less noise
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="nmh-page">
      <div className="nmh-shell">
        <header className="nmh-header">
          <Logo />
          <nav className="nmh-desktop-nav" aria-label="Main navigation">
            <Link href="/browse">Browse</Link>
            <Link href="/interests">Requests</Link>
            <Link href="/login">Login</Link>
            <Link href="/register" className="nmh-nav-cta">Create Profile</Link>
          </nav>
          <Link href="/register" className="nmh-menu" aria-label="Create profile">
            <Icon name="user" size={24} />
          </Link>
        </header>

        <section className="nmh-hero">
          <div className="nmh-hero-copy">
            <div className="nmh-eyebrow">
              <Icon name="pin" size={17} />
              Free Founding Member launch
            </div>
            <h1>Create your profile. Let the right native family find you.</h1>
            <p>First 1,000 profiles per district get 2 years of free premium. Browse native profiles now, save alerts for growing places, and we will notify you when matching families join.</p>
            <div className="nmh-actions">
              <Link href="/register" className="nmh-primary">
                <Icon name="user" size={19} />
                Join Free
              </Link>
              <Link href="/browse" className="nmh-secondary">
                Browse Native Profiles
              </Link>
            </div>
            <div className="nmh-proof-row" aria-label="Trust highlights">
              <span>Native-place first</span>
              <span>2 years free premium</span>
              <span>Place alerts</span>
            </div>
            <p className="nmh-independent-note">Independent platform, not affiliated with Matrimony.com Limited.</p>
          </div>
          <HeroVisual />
        </section>

        <section className="nmh-search-panel" aria-labelledby="native-search-heading">
          <div>
            <p className="nmh-section-kicker">Start with hometown</p>
            <h2 id="native-search-heading">Search Native Places</h2>
          </div>
          <form action="/browse" className="nmh-search-form">
            <input name="native_place" placeholder="Village, town, district, or city" aria-label="Native place" />
            <button type="submit" aria-label="Search native place"><Icon name="search" size={23} /></button>
          </form>
          <div className="nmh-place-row" aria-label="Popular native place searches">
            {popularPlaces.map((place) => (
              <Link key={place} href={`/browse?native_place=${encodeURIComponent(place)}`}>{place}</Link>
            ))}
          </div>
        </section>

        <section className="nmh-section nmh-intent-section">
          <div className="nmh-section-heading">
            <p className="nmh-section-kicker">Why families join now</p>
            <h2>Founding Members make each native-place corridor useful.</h2>
          </div>
          <div className="nmh-intent-grid">
            <article>
              <Icon name="upload" size={25} />
              <h3>Seed your corridor</h3>
              <p>Create the first high-signal profile for your native place so future families have someone real to discover.</p>
            </article>
            <article>
              <Icon name="lock" size={25} />
              <h3>Stay free while it grows</h3>
              <p>The first 1,000 profiles in each district get 2 years of free premium while we build useful liquidity place by place.</p>
            </article>
            <article>
              <Icon name="heart" size={25} />
              <h3>Get notified later</h3>
              <p>If the right profile is not here yet, save your place and we will notify you as matching families join.</p>
            </article>
          </div>
        </section>

        <section className="nmh-section">
          <div className="nmh-section-heading">
            <p className="nmh-section-kicker">Premium trust, not empty privacy</p>
            <h2>Show enough to decide. Protect what should stay private.</h2>
          </div>
          <div className="nmh-trust-grid">
            {trustItems.map(([title, body, icon]) => (
              <article key={title} className="nmh-trust-card">
                <span><Icon name={icon} size={24} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="nmh-section">
          <div className="nmh-section-heading">
            <p className="nmh-section-kicker">What a family sees first</p>
            <h2>High-signal previews make privacy feel useful, not dead.</h2>
          </div>
          <div className="nmh-preview-demo">
            <article>
              <div className="nmh-demo-photo">
                <span><Icon name="shield" size={22} /></span>
              </div>
              <div className="nmh-demo-body">
                <div className="nmh-demo-topline">
                  <strong>Verified profile</strong>
                  <em>Phone checked</em>
                </div>
                <div className="nmh-demo-tags">
                  <span><Icon name="briefcase" size={13} />Software engineer</span>
                  <span><Icon name="pin" size={13} />Roots in Guntur</span>
                  <span><Icon name="home" size={13} />Family reviewing</span>
                </div>
                <p>Biodata, full name, and contact stay protected until both sides accept.</p>
              </div>
            </article>
            <aside>
              <span><Icon name="lock" size={18} /> Private by default</span>
              <span><Icon name="check" size={18} /> Enough context to request</span>
              <span><Icon name="chat" size={18} /> No random messages</span>
            </aside>
          </div>
        </section>

        <section className="nmh-section">
          <div className="nmh-section-heading">
            <p className="nmh-section-kicker">How we avoid the empty registry trap</p>
            <h2>Start narrow, build trust, then expand community by community.</h2>
          </div>
          <div className="nmh-trust-grid">
            {[
              ['Founding Member launch', 'Early users get free launch access so each native-place corridor can build real activity before paid plans matter.', 'pin'],
              ['High-signal previews', 'Profiles show practical details like roots, work, location, and photo choice before private biodata unlocks.', 'search'],
              ['Guided introductions', 'Families can use optional human-assisted support when they want extra vetting and coordination.', 'family'],
            ].map(([title, body, icon]) => (
              <article key={title} className="nmh-trust-card">
                <span><Icon name={icon} size={24} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="nmh-section">
          <div className="nmh-section-heading">
            <p className="nmh-section-kicker">Simple request flow</p>
            <h2>From profile to match, without pressure.</h2>
          </div>
          <div className="nmh-journey">
            {journey.map(([title, body], index) => (
              <article key={title} className="nmh-journey-step">
                <span>{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="nmh-section">
          <div className="nmh-section-heading">
            <p className="nmh-section-kicker">Featured native places</p>
            <h2>Find families from familiar roots.</h2>
          </div>
          <div className="nmh-region-grid">
            {regions.map(([region, places]) => (
              <article key={region} className="nmh-region-card">
                <div className="nmh-region-art" aria-hidden="true"><span /></div>
                <div>
                  <h3>{region}</h3>
                  <div className="nmh-region-places">
                    {places.map((place) => (
                      <Link key={place} href={`/browse?native_place=${encodeURIComponent(place)}`}>{place}</Link>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Link href="/browse" className="nmh-text-link">View All Native Places <Icon name="arrow" size={18} /></Link>
        </section>

        <section className="nmh-consultant">
          <div className="nmh-consultant-art" aria-hidden="true">
            <span />
          </div>
          <div>
            <p className="nmh-section-kicker">Guided introductions</p>
            <h2>Want a family coordinator?</h2>
            <p>Use optional human-assisted matchmaking when your family wants profile vetting, shortlist help, and guided introductions.</p>
            <div className="nmh-check-list">
              <span><Icon name="check" size={15} />Native-place and profile review</span>
              <span><Icon name="check" size={15} />Native-place context</span>
              <span><Icon name="check" size={15} />Optional guided support</span>
            </div>
          </div>
          <Link href="/consultants" className="nmh-primary">View Consultants</Link>
        </section>

        <section className="nmh-final">
          <div>
            <p className="nmh-section-kicker">Create now, match when ready</p>
            <h2>Be visible to the right family before they search elsewhere.</h2>
            <p>Join free as a Founding Member. The first 1,000 profiles per district get 2 years of free premium while each corridor grows.</p>
          </div>
          <div className="nmh-actions">
            <Link href="/register" className="nmh-primary">Join Free</Link>
            <Link href="/browse" className="nmh-secondary">Browse Native Profiles</Link>
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
