'use client'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  void error

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <main style={{ alignItems: 'center', background: '#FBFAF5', color: '#14241C', display: 'flex', minHeight: '100vh', justifyContent: 'center', padding: '24px' }}>
          <section style={{ maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ alignItems: 'center', background: '#EDF3ED', border: '1px solid #CADFCA', borderRadius: '18px', display: 'inline-flex', height: '58px', justifyContent: 'center', marginBottom: '20px', width: '58px' }}>
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#075E3E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-5" />
              </svg>
            </div>
            <p style={{ color: '#075E3E', fontSize: '12px', fontWeight: 900, letterSpacing: '0.08em', margin: '0 0 8px', textTransform: 'uppercase' }}>Native Matrimony</p>
            <h1 style={{ color: '#14241C', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 10px' }}>We could not load this page</h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', lineHeight: 1.6, margin: '0 0 22px' }}>
              Your profile details are safe. Please try again, or return home and continue browsing.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => unstable_retry()} style={{ background: '#14241C', border: 0, borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 800, padding: '12px 18px' }}>
                Try again
              </button>
              <button onClick={() => { window.location.href = '/' }} style={{ background: 'white', border: '1px solid #CADFCA', borderRadius: '10px', color: '#14241C', cursor: 'pointer', fontSize: '14px', fontWeight: 800, padding: '12px 18px' }}>
                Go home
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
