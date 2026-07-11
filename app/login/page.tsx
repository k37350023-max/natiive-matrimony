'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BrandLogo from '../components/BrandLogo'
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'

const COUNTRY_CODES = [
  { code: '+91', label: '+91' },
  { code: '+1', label: '+1' },
  { code: '+44', label: '+44' },
  { code: '+61', label: '+61' },
  { code: '+971', label: '+971' },
  { code: '+65', label: '+65' },
]

function phoneAuthErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : ''
  if (message.includes('auth/operation-not-allowed')) {
    return 'SMS is not enabled for this country yet. Please contact support or try another country code.'
  }
  if (message.includes('auth/too-many-requests')) {
    return 'Too many code requests. Please wait a few minutes and try again.'
  }
  if (message.includes('auth/invalid-phone-number')) {
    return 'Enter a valid mobile number with the correct country code.'
  }
  return message || 'Could not send OTP'
}

async function readApiJson(res: Response) {
  const text = await res.text()
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    if (text.includes('Vercel Security Checkpoint')) {
      throw new Error('Security check blocked this request. Please refresh the page and try again.')
    }
    throw new Error('Server returned an unexpected response. Please try again.')
  }
  return JSON.parse(text)
}

export default function LoginPage() {
  const router = useRouter()
  const [phoneCode, setPhoneCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<ConfirmationResult | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [emailMode, setEmailMode] = useState<'password' | 'code'>('password')
  const [emailAddr, setEmailAddr] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailToken, setEmailToken] = useState('')
  const [emailDevOtp, setEmailDevOtp] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

  // Resend countdown — 30s between OTP sends (also softens rate limits).
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn(s => (s > 1 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [resendIn > 0])

  async function sendFirebaseOtp(fullPhone: string) {
    const { firebaseClientConfigured, getFirebaseAuth } = await import('@/lib/firebaseClient')
    if (!firebaseClientConfigured()) return false

    const auth = getFirebaseAuth()
    if (!auth) return false

    const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth')
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'firebase-recaptcha-login', {
        size: 'invisible',
      })
    }

    const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current)
    setFirebaseConfirmation(confirmation)
    setOtpToken('')
    setDevOtp('')
    return true
  }

  async function sendOtp() {
    if (phone.trim().length < 7) { setError('Enter a valid mobile number'); return }
    setLoading(true)
    setError('')
    try {
      const fullPhone = `${phoneCode}${phone.trim()}`

      // Try Firebase phone auth first; if it fails OR hangs (region not enabled,
      // billing, stuck reCAPTCHA challenge), fall back to the server OTP path.
      let sentWithFirebase = false
      try {
        sentWithFirebase = await Promise.race([
          sendFirebaseOtp(fullPhone),
          new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('firebase-timeout')), 8000)),
        ])
      } catch {
        try { recaptchaRef.current?.clear() } catch {}
        recaptchaRef.current = null
        setFirebaseConfirmation(null)
        sentWithFirebase = false
      }
      if (sentWithFirebase) {
        setOtpSent(true); setResendIn(30)
        return
      }

      const res = await fetch('/api/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(data.error || 'Could not send OTP')
      setOtpToken(data.token)
      setDevOtp(data.dev_otp || '')
      setOtpSent(true); setResendIn(30)
    } catch (err: unknown) {
      setError(phoneAuthErrorMessage(err))
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
      let firebaseIdToken = ''
      if (firebaseConfirmation) {
        const credential = await firebaseConfirmation.confirm(otp.trim())
        firebaseIdToken = await credential.user.getIdToken()
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          firebaseIdToken
            ? { phone: fullPhone, firebaseIdToken }
            : { phone: fullPhone, otp: otp.trim(), token: otpToken },
        ),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('my_user_id', data.userId)
      localStorage.setItem('my_profile_id', data.profileId)
      router.push('/browse')
    } catch (err: unknown) {
      setError(phoneAuthErrorMessage(err) || 'Login failed. Check your mobile number and OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordLogin() {
    const em = emailAddr.trim().toLowerCase()
    if (!em.includes('@')) { setError('Enter a valid email address'); return }
    if (!emailPassword) { setError('Enter your password'); return }
    setLoading(true); setError('')
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password: emailPassword }),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('my_user_id', data.userId)
      localStorage.setItem('my_profile_id', data.profileId)
      router.push('/browse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  async function sendEmailOtp() {
    const em = emailAddr.trim().toLowerCase()
    if (!em.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(data.error || 'Could not send code')
      setEmailToken(data.token)
      setEmailDevOtp(data.dev_otp || '')
      setEmailSent(true); setResendIn(30)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailLogin() {
    if (emailOtp.trim().length < 4) { setError('Enter the code from your email'); return }
    setLoading(true); setError('')
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr.trim().toLowerCase(), emailOtp: emailOtp.trim(), token: emailToken }),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('my_user_id', data.userId)
      localStorage.setItem('my_profile_id', data.profileId)
      router.push('/browse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your email and code.')
    } finally {
      setLoading(false)
    }
  }

  // One-click test sign-in (dev only). Creates/uses a stable test account and
  // sets the session cookie - no credentials needed.
  async function devLogin(role: 'groom' | 'bride') {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await readApiJson(res)
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
      <div id="firebase-recaptcha-login" />

      {/* Header */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '390px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <BrandLogo className="app-brand-compact" showTagline={false} />
          <Link href="/register" className="btn-primary" style={{ fontSize: '13.5px', padding: '8px 14px', whiteSpace: 'nowrap' }}>Join Free</Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left panel - desktop only */}
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
            Search by native place first. Names, photos, and profile details are visible unless hidden. Contact opens after connection.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Native place and current location filters',
              'Photo visibility control from your profile privacy settings',
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

        {/* Right - form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '34px 16px 40px' }}>
          <div style={{ width: '100%', maxWidth: '360px' }}>

            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', margin: '0 0 6px', fontFamily: 'var(--font-inter), sans-serif' }}>
                Welcome back
              </h1>
              <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>Sign in with your mobile number or email</p>
            </div>

            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E8E8E8', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '22px 20px' }}>
              {error && (
                <div style={{ marginBottom: '16px', padding: '11px 14px', borderRadius: '8px', fontSize: '13.5px', background: '#EDF3ED', color: '#14241C', border: '1px solid #CADFCA' }}>
                  {error}
                </div>
              )}
              {/* Method toggle */}
              {!otpSent && !emailSent && (
                <div style={{ display: 'flex', gap: '6px', padding: '4px', background: '#F1F5EF', borderRadius: '10px', marginBottom: '16px' }}>
                  {(['phone', 'email'] as const).map(m => (
                    <button key={m} onClick={() => { setMethod(m); setError('') }}
                      style={{ flex: 1, padding: '9px', fontSize: '13.5px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: method === m ? '#FFFFFF' : 'transparent', color: method === m ? '#14241C' : '#6B7A70',
                        boxShadow: method === m ? '0 1px 3px rgba(20,36,28,0.12)' : 'none' }}>
                      {m === 'phone' ? 'Mobile number' : 'Email'}
                    </button>
                  ))}
                </div>
              )}

              {method === 'phone' ? (
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => { setOtpSent(false); setOtp(''); setOtpToken(''); setDevOtp(''); setFirebaseConfirmation(null); setError(''); setResendIn(0) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '13px' }}>
                      Change mobile number
                    </button>
                    {resendIn > 0 ? (
                      <span style={{ fontSize: '13px', color: '#94A3B8' }}>Resend OTP in {resendIn}s</span>
                    ) : (
                      <button onClick={() => { if (!loading) { setOtp(''); sendOtp() } }} disabled={loading}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1B5E20', fontSize: '13px', fontWeight: 700 }}>
                        Resend OTP
                      </button>
                    )}
                  </div>
                )}
              </div>
              ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Password vs one-time code */}
                {!emailSent && (
                  <div style={{ display: 'flex', gap: '18px', fontSize: '13px' }}>
                    {(['password', 'code'] as const).map(sm => (
                      <button key={sm} onClick={() => { setEmailMode(sm); setError('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: emailMode === sm ? 700 : 500,
                          color: emailMode === sm ? '#14241C' : '#94A3B8', borderBottom: emailMode === sm ? '2px solid #1B5E20' : '2px solid transparent' }}>
                        {sm === 'password' ? 'Password' : 'Email me a code'}
                      </button>
                    ))}
                  </div>
                )}
                <div>
                  <label className="form-label">Email address</label>
                  <input className="input" type="email" placeholder="you@example.com" value={emailAddr} disabled={emailSent}
                    onChange={e => setEmailAddr(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { emailMode === 'password' ? handlePasswordLogin() : (emailSent ? handleEmailLogin() : sendEmailOtp()) } }} />
                </div>

                {emailMode === 'password' ? (
                  <>
                    <div>
                      <label className="form-label">Password</label>
                      <input className="input" type="password" placeholder="Your password" value={emailPassword}
                        onChange={e => setEmailPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()} />
                    </div>
                    <button onClick={handlePasswordLogin} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '4px', borderRadius: '8px' }}>
                      {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                    <p style={{ fontSize: '12.5px', color: '#94A3B8', textAlign: 'center', margin: 0 }}>
                      No password yet? Sign in with a code, then set one in <Link href="/profile/edit" style={{ color: '#1B5E20', fontWeight: 600, textDecoration: 'none' }}>your profile</Link>.
                    </p>
                  </>
                ) : (
                  <>
                    {emailSent && (
                      <>
                        {emailDevOtp && (
                          <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '12px', background: '#EDF3ED', color: '#14241C', border: '1px solid #CADFCA' }}>
                            Dev mode code: <strong>{emailDevOtp}</strong>
                          </div>
                        )}
                        <div>
                          <label className="form-label">Code from your email</label>
                          <input className="input" inputMode="numeric" placeholder="Enter 6-digit code" value={emailOtp}
                            onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={e => e.key === 'Enter' && handleEmailLogin()} />
                        </div>
                      </>
                    )}
                    <button onClick={emailSent ? handleEmailLogin : sendEmailOtp} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '4px', borderRadius: '8px' }}>
                      {loading ? (emailSent ? 'Signing in…' : 'Sending code…') : (emailSent ? 'Sign In' : 'Email me a code')}
                    </button>
                    {emailSent && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={() => { setEmailSent(false); setEmailOtp(''); setEmailToken(''); setEmailDevOtp(''); setError(''); setResendIn(0) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '13px' }}>
                          Change email
                        </button>
                        {resendIn > 0 ? (
                          <span style={{ fontSize: '13px', color: '#94A3B8' }}>Resend in {resendIn}s</span>
                        ) : (
                          <button onClick={() => { if (!loading) { setEmailOtp(''); sendEmailOtp() } }} disabled={loading}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1B5E20', fontSize: '13px', fontWeight: 700 }}>
                            Resend code
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              )}
            </div>

            {process.env.NODE_ENV !== 'production' && (
              <div style={{ marginTop: '14px', padding: '14px', borderRadius: '12px', background: '#EDF3ED', border: '1px dashed #1B5E20' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#14241C', margin: '0 0 8px', textAlign: 'center' }}>Test mode - one-click sign-in</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <button onClick={() => devLogin('groom')} disabled={loading}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #14241C', background: 'white', color: '#14241C', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    Sign in as Test Profile 1
                  </button>
                  <button onClick={() => devLogin('bride')} disabled={loading}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #14241C', background: 'white', color: '#14241C', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    Sign in as Test Profile 2
                  </button>
                </div>
                <p style={{ fontSize: '10.5px', color: '#5E6B62', margin: '8px 0 0', textAlign: 'center' }}>Two real test accounts - connect one to the other to test the full flow. Auto-disabled in production.</p>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#999', marginTop: '20px' }}>
              No account yet?{' '}
              <Link href="/register" style={{ fontWeight: 600, color: '#14241C', textDecoration: 'none' }}>Join free</Link>
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', marginTop: '28px', paddingTop: '22px', borderTop: '1px solid #EEEEEE' }}>
              {[
                { stat: 'Private', label: 'Full profile' },
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
