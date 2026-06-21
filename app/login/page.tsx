'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      // Server verifies credentials and sets the trusted httpOnly session cookie.
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      // Keep localStorage in sync for pages not yet migrated to the cookie.
      localStorage.setItem('my_user_id', data.userId)
      localStorage.setItem('my_profile_id', data.profileId)
      router.push('/browse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  // One-click test sign-in (dev only). Creates/uses a stable test account and
  // sets the session cookie — no credentials needed.
  async function devLogin(role: 'groom' | 'bride') {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test sign-in failed')
      localStorage.setItem('my_user_id', data.userId)
      localStorage.setItem('my_profile_id', data.profileId)
      router.push('/browse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Test sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>

      {/* Header */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: '21px', letterSpacing: '-0.03em', lineHeight: 1 }}>
              <span style={{ fontWeight: 700, color: '#0B132B' }}>native</span><span style={{ fontWeight: 400, color: '#5B6478' }}>matrimony</span><span style={{ fontWeight: 700, color: '#4CC9F0' }}>.</span>
            </span>
          </Link>
          <Link href="/register" className="btn-primary" style={{ fontSize: '13.5px', padding: '8px 18px' }}>Register Free</Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left panel — desktop only */}
        <div className="hidden lg:flex" style={{
          flex: '0 0 420px', flexDirection: 'column', justifyContent: 'center', padding: '64px 56px',
          background: 'linear-gradient(160deg, #0B132B 0%, #0B132B 60%, #B91C1C 100%)',
          color: 'white',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, margin: '0 0 20px' }}>NativeMatrimony</p>
          <h2 style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-0.02em', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            Find your match from your native place
          </h2>
          <p style={{ fontSize: '15px', opacity: 0.8, margin: '0 0 40px', lineHeight: 1.65 }}>
            Telugu matrimony built around where you&apos;re from. District, region, mother tongue — it matters here.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Native place matching — not just age & job',
              'Private photos until you both connect',
              'Free access until September 2026',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: '14px', opacity: 0.88, lineHeight: 1.55 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '56px 20px 40px' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>

            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', margin: '0 0 6px', fontFamily: 'var(--font-inter), sans-serif' }}>
                Welcome back
              </h1>
              <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>Sign in to your account</p>
            </div>

            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E8E8E8', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '28px 24px' }}>
              {error && (
                <div style={{ marginBottom: '16px', padding: '11px 14px', borderRadius: '8px', fontSize: '13.5px', background: '#EAF8FE', color: '#0B132B', border: '1px solid #BDE9F7' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Email address</label>
                  <input className="input" type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    <Link href="/forgot-password" style={{ fontSize: '12.5px', fontWeight: 600, color: '#0B132B', textDecoration: 'none' }}>Forgot?</Link>
                  </div>
                  <input className="input" type="password" placeholder="Your password" value={password}
                    onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <button onClick={handleLogin} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '4px', borderRadius: '8px' }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </div>
            </div>

            {process.env.NODE_ENV !== 'production' && (
              <div style={{ marginTop: '14px', padding: '14px', borderRadius: '12px', background: '#EAF8FE', border: '1px dashed #4CC9F0' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#0B132B', margin: '0 0 8px', textAlign: 'center' }}>Test mode — one-click sign-in</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => devLogin('groom')} disabled={loading}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #0B132B', background: 'white', color: '#0B132B', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    Sign in as Groom
                  </button>
                  <button onClick={() => devLogin('bride')} disabled={loading}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #0B132B', background: 'white', color: '#0B132B', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    Sign in as Bride
                  </button>
                </div>
                <p style={{ fontSize: '10.5px', color: '#5B6478', margin: '8px 0 0', textAlign: 'center' }}>Two real test accounts — connect one to the other to test the full flow. Auto-disabled in production.</p>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#999', marginTop: '20px' }}>
              No account yet?{' '}
              <Link href="/register" style={{ fontWeight: 600, color: '#0B132B', textDecoration: 'none' }}>Register free</Link>
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '36px', paddingTop: '28px', borderTop: '1px solid #EEEEEE' }}>
              {[
                { stat: '5,000+', label: 'Members' },
                { stat: 'Free', label: 'Until Sept 2026' },
                { stat: '100%', label: 'Telugu' },
              ].map(t => (
                <div key={t.stat} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: '0 0 2px' }}>{t.stat}</p>
                  <p style={{ fontSize: '11px', color: '#AAAAAA', margin: 0 }}>{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
