import Link from 'next/link'
import BrandLogo from '../components/BrandLogo'

export default function ConsultantsPage() {
  return (
    <main className="landing-page">
      <div className="landing-shell">
        <header className="landing-header">
          <BrandLogo className="app-brand-home" />
          <Link href="/" className="landing-menu" aria-label="Back to home">
            <span />
            <span />
            <span />
          </Link>
        </header>

        <section className="consultant-card" style={{ alignItems: 'center' }}>
          <div className="consultant-copy">
            <p className="section-label mb-3">Guided introductions</p>
            <h2>Human-assisted matching</h2>
            <p>For families who want more than software, NativeMatrimony.com can coordinate vetted introductions, shortlist review, and next-step guidance while contact details open only after connection.</p>
            {['Profile and intent review', 'Native place context', 'Shortlist and introduction support', 'Optional premium service'].map(item => (
              <div className="consultant-bullet" key={item}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </div>
            ))}
          </div>
          <div className="consultant-actions">
            <Link href="/browse" className="landing-primary compact">Browse profiles</Link>
            <Link href="/pricing" className="landing-secondary compact">See guided help</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
