import MapHero from './components/MapHero'
import HomeHeader from './components/HomeHeader'
import HeroCTA from './components/HeroCTA'
import FounderTracker from './components/FounderTracker'
import LaunchBanner from './components/LaunchBanner'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F3F0' }}>

      <HomeHeader />

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section style={{ textAlign: 'center', padding: '72px 20px 48px', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '6px 14px', borderRadius: '99px', marginBottom: '28px',
            background: '#FEF2F2', color: '#7F1D1D', border: '1px solid #FECACA',
          }}>
            Telugu families · Native place first
          </div>
          <h1 className="font-serif-display" style={{
            fontSize: 'clamp(36px, 6vw, 58px)', fontWeight: 700,
            color: '#0F0F0F', lineHeight: 1.12, letterSpacing: '-0.02em',
            marginBottom: '20px',
          }}>
            Find your match<br />
            <span style={{ color: '#7F1D1D' }}>from your native place</span>
          </h1>
          <p style={{ fontSize: '16.5px', color: '#6B7280', maxWidth: '420px', margin: '0 auto 36px', lineHeight: 1.65 }}>
            Telugu matrimony built around where you&apos;re from.
            Join free — first 1,000 members get premium for life.
          </p>
          <HeroCTA />
        </section>

        {/* ── Founder offer banner ─────────────────────────── */}
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px 8px' }}>
          <LaunchBanner />
        </div>

        {/* ── Trust stats ──────────────────────────────────── */}
        <div style={{ maxWidth: '560px', margin: '32px auto', padding: '0 20px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            background: 'white', borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {[
              { n: '1,000', label: 'Free premium spots' },
              { n: 'Private', label: 'Photos until match' },
              { n: 'Telugu', label: 'Families only' },
            ].map(({ n, label }, i) => (
              <div key={n} style={{
                textAlign: 'center', padding: '20px 12px',
                borderRight: i < 2 ? '1px solid #F3F4F6' : 'none',
              }}>
                <p className="font-serif-display" style={{ fontWeight: 700, color: '#0F0F0F', fontSize: '20px', margin: '0 0 2px' }}>{n}</p>
                <p style={{ fontSize: '11.5px', color: '#9CA3AF', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Map section ──────────────────────────────────── */}
        <section style={{ padding: '40px 20px 60px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7F1D1D', margin: '0 0 10px' }}>Browse by native place</p>
              <h2 className="font-serif-display" style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 700, color: '#0F0F0F', letterSpacing: '-0.02em', margin: 0 }}>
                Pick your district. See who&apos;s from there.
              </h2>
            </div>
            <MapHero />
          </div>
        </section>

        {/* ── Parents banner ───────────────────────────────── */}
        <div style={{ maxWidth: '900px', margin: '0 auto 48px', padding: '0 20px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '18px 22px', borderRadius: '16px',
            background: '#FFFBEB', border: '1px solid #FDE68A',
          }}>
            <div style={{ fontSize: '24px', flexShrink: 0 }}>👨‍👩‍👧</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: '0 0 3px' }}>Parents — you can register on behalf of your child</p>
              <p style={{ fontSize: '12.5px', color: '#6B7280', margin: 0 }}>Select "Profile by: Parent / Guardian" during signup.</p>
            </div>
            <Link href="/register" style={{
              fontSize: '12.5px', fontWeight: 700, padding: '8px 16px',
              borderRadius: '99px', background: '#7F1D1D', color: 'white',
              textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              Start →
            </Link>
          </div>
        </div>

        {/* ── Feature cards ────────────────────────────────── */}
        <section style={{ maxWidth: '900px', margin: '0 auto 80px', padding: '0 20px' }}>
          <h2 className="font-serif-display" style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: '#0F0F0F', textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '32px' }}>
            Why families choose us
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              {
                title: 'Privacy by design',
                desc: 'Photos and contact details unlock only after both sides accept. Your information is never exposed without consent.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
              },
              {
                title: 'Native place matching',
                desc: 'Filter by region, district, and native village. Find someone who truly understands your roots and traditions.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                ),
              },
              {
                title: 'Mutual interest model',
                desc: 'Both parties must accept before any contact is exchanged. No unsolicited messages, ever.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                ),
              },
            ].map(f => (
              <div key={f.title} style={{
                background: 'white', borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                padding: '24px',
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF2F2', marginBottom: '16px' }}>
                  {f.icon}
                </div>
                <p className="font-serif-display" style={{ fontWeight: 700, fontSize: '16px', color: '#0F0F0F', marginBottom: '8px', letterSpacing: '-0.01em' }}>{f.title}</p>
                <p style={{ fontSize: '13.5px', color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────── */}
        <section style={{ padding: '0 20px 80px' }}>
          <div style={{
            maxWidth: '520px', margin: '0 auto', textAlign: 'center',
            background: 'white', borderRadius: '24px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: '48px 40px',
          }}>
            <p style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7F1D1D', marginBottom: '12px' }}>Limited founding spots remaining</p>
            <h3 className="font-serif-display" style={{ fontSize: '28px', fontWeight: 700, color: '#0F0F0F', letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Your Telugu match is waiting
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.65, marginBottom: '28px' }}>
              Join the first 1,000 members and get a full year of premium free. No credit card required.
            </p>
            <Link href="/register" className="btn-primary" style={{ width: '100%', fontSize: '15px', padding: '14px 24px', display: 'block' }}>
              Claim your free spot →
            </Link>
            <p style={{ fontSize: '12px', color: '#C4C4C4', marginTop: '14px' }}>
              After 1,000 members · <Link href="/pricing" style={{ textDecoration: 'underline', color: 'inherit' }}>See pricing</Link>
            </p>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid #F0EDE8', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <p style={{ fontWeight: 700, color: '#374151', fontSize: '13.5px', marginBottom: '6px' }}>NativeMatrimony</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '10px' }}>Built for Telugu families · Hyderabad, Telangana · Est. 2025</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
            <a href="mailto:support@nativematrimony.com" style={{ textDecoration: 'underline', color: 'inherit' }}>support@nativematrimony.com</a>
            {' · '}
            <Link href="/pricing" style={{ textDecoration: 'underline', color: 'inherit' }}>Pricing</Link>
            {' · '}
            <Link href="/privacy" style={{ textDecoration: 'underline', color: 'inherit' }}>Privacy</Link>
            {' · '}
            <Link href="/terms" style={{ textDecoration: 'underline', color: 'inherit' }}>Terms</Link>
          </p>
          <p style={{ fontSize: '11px', color: '#D1D5DB', marginTop: '10px' }}>© 2026 NativeMatrimony. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
