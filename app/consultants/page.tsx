import Link from 'next/link'

export default function ConsultantsPage() {
  return (
    <main className="landing-page">
      <div className="landing-shell">
        <header className="landing-header">
          <Link href="/" className="home-logo" aria-label="NativeMatrimony home">
            <span>native</span>
            <span>matrimony</span>
            <small>Your hometown. Your roots. Your match.</small>
          </Link>
          <Link href="/" className="landing-menu" aria-label="Back to home">
            <span />
            <span />
            <span />
          </Link>
        </header>

        <section className="consultant-card" style={{ alignItems: 'center' }}>
          <div className="consultant-copy">
            <h2>Verified Local Consultants</h2>
            <p>Personalized matchmaking support is optional. NativeMatrimony keeps your profile private, and biodata/contact unlock only after acceptance.</p>
            {['Verified by NativeMatrimony', 'Local community expertise', 'Personalized matchmaking', 'Optional service'].map(item => (
              <div className="consultant-bullet" key={item}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </div>
            ))}
          </div>
          <div className="consultant-actions">
            <Link href="/register" className="landing-primary compact">Create Free Profile</Link>
            <Link href="/browse" className="landing-secondary compact">Browse Profiles</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
