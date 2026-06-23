import Link from 'next/link'

const POPULAR_PLACES = ['Guntur', 'Warangal', 'Nellore', 'Coimbatore', 'Madurai', 'Rajkot', 'Vijayawada', 'Chennai', 'Mysore']

function Logo() {
  return (
    <Link href="/" className="nm-logo" aria-label="NativeMatrimony home">
      <span>native</span>
      <span>matrimony</span>
    </Link>
  )
}

function VillageIllustration() {
  return (
    <div aria-hidden="true" style={{ position: 'relative', height: '210px', margin: '20px -18px 0', overflow: 'hidden' }}>
      <svg viewBox="0 0 390 220" width="100%" height="220" fill="none" style={{ display: 'block' }}>
        <path d="M0 190C45 163 88 159 132 177C176 195 208 186 248 165C292 142 338 151 390 177V220H0V190Z" fill="#F2F6EA" />
        <path d="M14 183C51 159 88 153 124 170C164 188 207 183 245 160C291 133 340 144 379 169" stroke="#B9CEB0" strokeWidth="2" />
        <path d="M100 162H178V204H100V162Z" fill="#F7E9C7" stroke="#9CB28E" strokeWidth="2" />
        <path d="M90 162L139 122L188 162H90Z" fill="#E9C980" stroke="#9CB28E" strokeWidth="2" />
        <path d="M126 204V176C126 168 132 162 140 162C148 162 154 168 154 176V204" fill="#FFF8E8" stroke="#9CB28E" strokeWidth="2" />
        <path d="M229 158L249 102L269 158H229Z" fill="#F1D992" stroke="#9CB28E" strokeWidth="2" />
        <path d="M236 158H262V204H236V158Z" fill="#F8EDD1" stroke="#9CB28E" strokeWidth="2" />
        <path d="M249 86V102" stroke="#0D6B44" strokeWidth="3" strokeLinecap="round" />
        <path d="M49 201V140" stroke="#8FAE80" strokeWidth="4" strokeLinecap="round" />
        <path d="M49 140C34 144 22 153 17 166M49 140C64 145 74 155 79 170M49 139C49 122 58 109 71 101M49 139C39 123 28 115 16 112" stroke="#7EA36F" strokeWidth="3" strokeLinecap="round" />
        <path d="M334 202V131" stroke="#8FAE80" strokeWidth="4" strokeLinecap="round" />
        <path d="M334 131C319 135 307 146 303 160M334 131C350 136 360 148 365 164M334 130C333 113 342 101 355 93M334 130C323 115 312 107 300 105" stroke="#7EA36F" strokeWidth="3" strokeLinecap="round" />
        <path d="M22 196C61 202 96 199 126 191C163 181 194 181 226 192C257 202 306 202 365 190" stroke="#C7D8BB" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, #FFFEFA 100%)' }} />
    </div>
  )
}

export default function Home() {
  return (
    <main className="nm-page">
      <div className="nm-shell" style={{ width: '100%', maxWidth: '340px', overflow: 'hidden' }}>
        <header className="nm-topbar">
          <Logo />
          <Link href="/login" className="nm-icon-btn" aria-label="Open menu">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </Link>
        </header>

        <section style={{ paddingTop: '72px' }}>
          <h1 className="nm-title" style={{ fontSize: '34px', margin: 0, maxWidth: '330px' }}>
            Find someone who shares your roots.
          </h1>
          <p className="nm-muted" style={{ fontSize: '15px', lineHeight: 1.7, margin: '20px 0 0', maxWidth: '292px' }}>
            Search your native place and connect with people from there.
          </p>

          <div style={{ textAlign: 'center', color: '#7B7C62', marginTop: '22px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <VillageIllustration />

          <form action="/browse" className="nm-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 44px', gap: '8px', padding: '8px', marginTop: '-28px', position: 'relative', zIndex: 2 }}>
            <input name="native_place" placeholder="Enter your native place" aria-label="Native place" className="nm-input" style={{ border: 0, paddingLeft: '12px' }} />
            <input name="current_location" aria-label="Current location" style={{ display: 'none' }} />
            <button type="submit" className="nm-icon-btn" style={{ background: '#F4F8F0', color: '#075E3E' }} aria-label="Search">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>

          <div style={{ marginTop: '26px' }}>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#071527', margin: '0 0 12px' }}>Popular Searches</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
              {POPULAR_PLACES.map(place => (
                <Link key={place} href={`/browse?native_place=${encodeURIComponent(place)}`} className="nm-chip">
                  {place}
                </Link>
              ))}
            </div>
          </div>

          <div className="nm-soft-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', marginTop: '26px' }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#075E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <p style={{ margin: 0, fontSize: '12px', color: '#26352C', lineHeight: 1.55 }}>
              <strong>Privacy-first registry.</strong><br />
              Biodata and contact unlock only after request acceptance.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
