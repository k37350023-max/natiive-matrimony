'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COUNTRY_CODES = [
  { code: '+91', label: '+91' },
  { code: '+1', label: '+1' },
  { code: '+44', label: '+44' },
  { code: '+61', label: '+61' },
  { code: '+971', label: '+971' },
  { code: '+65', label: '+65' },
]

export default function LoginPage() {
  const router = useRouter()
  const [phoneCode, setPhoneCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendOtp() {
    if (phone.trim().length < 7) { setError('Enter a valid mobile number'); return }
    setLoading(true)
    setError('')
    try {
      const fullPhone = `${phoneCode}${phone.trim()}`
      const res = await fetch('/api/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send OTP')
      setOtpToken(data.token)
      setDevOtp(data.dev_otp || '')
      setOtpSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    if (otp.trim().length < 4) { setError('Enter the OTP'); return }
    setLoading(true)
    setError('')
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      const fullPhone = `${phoneCode}${phone.trim()}`
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, otp: otp.trim(), token: otpToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('my_user_id', data.userId)
      localStorage.setItem('my_profile_id', data.profileId)
      router.push('/browse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your mobile number and OTP.')
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBFAF5' }}>

      {/* Header */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '390px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: '21px', letterSpacing: '-0.03em', lineHeight: 1 }}>
              <span style={{ fontWeight: 700, color: '#14241C' }}>native</span><span style={{ fontWeight: 400, color: '#1B5E20' }}>matrimony</span><span style={{ fontWeight: 700, color: '#1B5E20' }}>.</span>
            </span>
          </Link>
          <Link href="/register" className="btn-primary" style={{ fontSize: '13.5px', padding: '8px 14px', whiteSpace: 'nowrap' }}>Create Profile</Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left panel — desktop only */}
        <div className="hidden lg:flex" style={{
          flex: '0 0 420px', flexDirection: 'column', justifyContent: 'center', padding: '64px 56px',
          background: 'linear-gradient(160deg, #071527 0%, #0B2F24 58%, #075E3E 100%)',
          color: 'white',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, margin: '0 0 20px' }}>NativeMatrimony</p>
          <h2 style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-0.02em', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            Find someone who shares your roots.
          </h2>
          <p style={{ fontSize: '15px', opacity: 0.8, margin: '0 0 40px', lineHeight: 1.65 }}>
            Search by native place first. Biodata, photos, and contact stay private until a request is accepted.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Native place and current location filters',
              'Photo, full name, biodata, and contact locked before acceptance',
              'Mobile verification before a profile goes live',
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '34px 16px 40px' }}>
          <div style={{ width: '100%', maxWidth: '360px' }}>

            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', margin: '0 0 6px', fontFamily: 'var(--font-inter), sans-serif' }}>
                Welcome back
              </h1>
              <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>Sign in with your verified mobile number</p>
            </div>

            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E8E8E8', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '22px 20px' }}>
              {error && (
                <div style={{ marginBottom: '16px', padding: '11px 14px', borderRadius: '8px', fontSize: '13.5px', background: '#EDF3ED', color: '#14241C', border: '1px solid #CADFCA' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Mobile number</label>
                  <div style={{ display: 'flex', border: '1.5px solid #E7E3D8', borderRadius: '8px', overflow: 'hidden' }}>
                    <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                      disabled={otpSent}
                      style={{ background: '#FBFAF5', fontSize: '13px', fontWeight: 700, padding: '11px 8px', border: 'none', outline: 'none', borderRight: '1px solid #E7E3D8', flexShrink: 0 }}>
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <input style={{ flex: 1, padding: '11px 13px', fontSize: '14px', border: 'none', outline: 'none', background: 'white' }}
                      type="tel" placeholder="Mobile number" value={phone} disabled={otpSent}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => { if (e.key === 'Enter') otpSent ? handleLogin() : sendOtp() }} />
                  </div>
                </div>
                {otpSent && (
                  <>
                    {devOtp && (
                      <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '12px', background: '#EDF3ED', color: '#14241C', border: '1px solid #CADFCA' }}>
                        Dev mode OTP: <strong>{devOtp}</strong>
                      </div>
                    )}
                    <div>
                      <label className="form-label">OTP</label>
                      <input className="input" inputMode="numeric" placeholder="Enter OTP" value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    </div>
                  </>
                )}
                <button onClick={otpSent ? handleLogin : sendOtp} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '4px', borderRadius: '8px' }}>
                  {loading ? (otpSent ? 'Signing in…' : 'Sending OTP…') : (otpSent ? 'Sign In' : 'Send OTP')}
                </button>
                {otpSent && (
                  <button onClick={() => { setOtpSent(false); setOtp(''); setOtpToken(''); setDevOtp(''); setError('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '13px' }}>
                    Change mobile number
                  </button>
                )}
              </div>
            </div>

            {process.env.NODE_ENV !== 'production' && (
              <div style={{ marginTop: '14px', padding: '14px', borderRadius: '12px', background: '#EDF3ED', border: '1px dashed #1B5E20' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#14241C', margin: '0 0 8px', textAlign: 'center' }}>Test mode — one-click sign-in</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <button onClick={() => devLogin('groom')} disabled={loading}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #14241C', background: 'white', color: '#14241C', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    Sign in as Groom
                  </button>
                  <button onClick={() => devLogin('bride')} disabled={loading}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #14241C', background: 'white', color: '#14241C', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    Sign in as Bride
                  </button>
                </div>
                <p style={{ fontSize: '10.5px', color: '#5E6B62', margin: '8px 0 0', textAlign: 'center' }}>Two real test accounts — connect one to the other to test the full flow. Auto-disabled in production.</p>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#999', marginTop: '20px' }}>
              No account yet?{' '}
              <Link href="/register" style={{ fontWeight: 600, color: '#14241C', textDecoration: 'none' }}>Create profile</Link>
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', marginTop: '28px', paddingTop: '22px', borderTop: '1px solid #EEEEEE' }}>
              {[
                { stat: 'Private', label: 'Biodata' },
                { stat: 'Request', label: 'Based' },
                { stat: 'Phone', label: 'Verified' },
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
