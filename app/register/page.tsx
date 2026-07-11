'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BrandLogo from '../components/BrandLogo'
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'
import { INDIA_STATES } from '@/lib/nativePlaces'

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1',  label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+60', label: '🇲🇾 +60' },
  { code: '+64', label: '🇳🇿 +64' },
  { code: '+974', label: '🇶🇦 +974' },
]

/* ─── Label ──────────────────────────────────────────────────── */
function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
      {children} {optional && <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #E7E3D8', borderRadius: '8px',
  padding: '11px 13px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  background: 'white', color: '#111', transition: 'border-color 0.15s',
}

const FOUNDING_MEMBER_LIMIT = 1000

const PREMIUM_PERKS = [
  'Free forever basics',
  'Premium trial included',
  'Contact shown after connection',
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
  return message || 'Could not send code'
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

/* ─── Main ───────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter()
  // step: 1 = profile owner, 2 = basic details, 3 = OTP verification
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneCode, setPhoneCode] = useState('+91')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [devOtp, setDevOtp] = useState('')   // shown only in dev mode (no SMS key)
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<ConfirmationResult | null>(null)
  const [sending, setSending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [districtCount, setDistrictCount] = useState<number | null>(null)
  const otpRef = useRef<HTMLInputElement>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

  // Resend countdown - 30s between OTP sends.
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn(v => (v > 1 ? v - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [resendIn > 0])

  const [form, setForm] = useState({
    profile_created_by: 'self', full_name: '', gender: '', phone: '',
    date_of_birth: '', native_state: '', native_district: '', current_city: '',
  })
  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))
  const [googleAuth, setGoogleAuth] = useState<{ idToken: string; email: string; name: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const place = params.get('native_place')?.trim()
    if (place) setForm(f => f.native_district ? f : ({ ...f, native_district: place }))
    // Google-verified signup: prefill name + email, skip phone entirely.
    if (params.get('google') === '1') {
      try {
        const g = JSON.parse(sessionStorage.getItem('nm_google') || 'null')
        if (g?.idToken) {
          setGoogleAuth(g)
          setForm(f => ({ ...f, full_name: f.full_name || g.name || '' }))
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (id) router.replace(`/profile/${id}`)
  }, [])

  useEffect(() => { if (step === 3) setTimeout(() => otpRef.current?.focus(), 100) }, [step])

  const districts = form.native_state ? (INDIA_STATES[form.native_state] || []) : []
  const foundingClaimed = Math.min(districtCount ?? 0, FOUNDING_MEMBER_LIMIT)
  const foundingRemaining = Math.max(FOUNDING_MEMBER_LIMIT - foundingClaimed, 0)
  const foundingPct = districtCount === null ? 0 : Math.min(Math.round((foundingClaimed / FOUNDING_MEMBER_LIMIT) * 100), 100)
  const selectedDistrict = form.native_district.trim()
  const foundingApplied = !!selectedDistrict && districtCount !== null && foundingRemaining > 0
  useEffect(() => {
    if (!selectedDistrict) {
      setDistrictCount(null)
      return
    }
    let cancelled = false
    supabase.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('native_state', form.native_state)
      .eq('native_district', selectedDistrict)
      .eq('status', 'approved')
      .then(({ count }) => { if (!cancelled) setDistrictCount(count ?? 0) })
    return () => { cancelled = true }
  }, [selectedDistrict, form.native_state])

  /* Step 1 → send a real OTP (dev mode returns the code in the response) */
  async function sendFirebaseOtp(fullPhone: string) {
    const { firebaseClientConfigured, getFirebaseAuth } = await import('@/lib/firebaseClient')
    if (!firebaseClientConfigured()) return false

    const auth = getFirebaseAuth()
    if (!auth) return false

    const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth')
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'firebase-recaptcha-register', {
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
    if (!form.full_name.trim()) return setError('Please enter your name')
    if (!form.gender) return setError('Please select gender')
    if (!form.date_of_birth) return setError('Date of birth is required')
    if (!form.native_state) return setError('Please select your native state')
    if (!form.native_district) return setError('Please select your native place')
    if (!form.current_city.trim()) return setError('Current city is required')
    if (form.phone.trim().length < 7) return setError('Enter a valid mobile number')
    setError(''); setSending(true)
    try {
      const fullPhone = `${phoneCode}${form.phone.trim()}`

      // Firebase phone auth first; fall back to server OTP if it fails OR hangs
      // (region not enabled, billing, stuck reCAPTCHA) so signup still works.
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
        setStep(3); setResendIn(30)
        return
      }

      const res = await fetch('/api/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(data.error || 'Could not send code')
      setOtpToken(data.token)
      setDevOtp(data.dev_otp || '')   // present only when no SMS gateway configured
      setStep(3); setResendIn(30)
    } catch (err) {
      setError(phoneAuthErrorMessage(err))
    } finally { setSending(false) }
  }

  /* Step 2 → verify the OTP server-side */
  async function verifyOtp() {
    if (otp.trim().length < 4) return setError('Enter the 6-digit code')
    setError(''); setSending(true)
    try {
      const fullPhone = `${phoneCode}${form.phone.trim()}`
      if (firebaseConfirmation) {
        const credential = await firebaseConfirmation.confirm(otp.trim())
        const firebaseIdToken = await credential.user.getIdToken()
        await handleSubmit(firebaseIdToken)
        return
      }

      const res = await fetch('/api/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otp.trim(), token: otpToken, phone: fullPhone }),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(data.error || 'Incorrect code')
      await handleSubmit()
    } catch (err) {
      setError(phoneAuthErrorMessage(err))
    } finally { setSending(false) }
  }

  /* Create the minimal profile and go inside */
  async function handleSubmit(firebaseIdToken?: string) {
    if (!form.profile_created_by) return setError('Please select who this profile is for')
    if (!form.date_of_birth) return setError('Date of birth is required')
    if (!form.native_state) return setError('Please select your native state')
    if (!form.native_district) return setError('Please select your native district')
    if (!form.current_city.trim()) return setError('Current city is required')
    setLoading(true); setError('')
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      // Server re-verifies the OTP, creates the account, and sets the session cookie.
      const fullPhone = `${phoneCode}${form.phone.trim()}`
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name, gender: form.gender,
          date_of_birth: form.date_of_birth, native_state: form.native_state,
          native_district: form.native_district, current_city: form.current_city,
          profile_created_by: form.profile_created_by,
          ...(googleAuth
            ? { googleIdToken: googleAuth.idToken }
            : { phone: fullPhone, ...(firebaseIdToken ? { firebaseIdToken } : { otp: otp.trim(), token: otpToken }) }),
        }),
      })
      const data = await readApiJson(res)
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      localStorage.setItem('my_user_id', data.userId)
      localStorage.setItem('my_profile_id', data.profileId)
      const benefit = data.foundingMemberEligible ? 'founding_2y' : 'premium_3m'
      // Route straight to Browse for their native place — matches (or an alert) await.
      const place = form.native_district.trim()
      router.push(`/browse?new=1&benefit=${benefit}${place ? `&native_place=${encodeURIComponent(place)}` : ''}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  function continueFromOwnerStep() {
    if (!form.native_state) return setError('Please select your native state')
    if (!form.native_district) return setError('Please select your native place')
    if (!form.profile_created_by) return setError('Please select who this profile is for')
    setError('')
    setStep(2)
  }

  const STEP_META = [
    { n: 1, title: 'Create your free profile', sub: 'Takes less than 30 seconds. Start with your native place.' },
    { n: 2, title: 'Basic details', sub: 'Just the essentials — you can complete details later.' },
    { n: 3, title: 'Verify your mobile', sub: `We sent a code to ${phoneCode} ${form.phone}` },
  ][step - 1]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBFAF5' }}>
      <div id="firebase-recaptcha-register" />
      <header style={{ background: 'white', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '390px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <BrandLogo className="app-brand-compact" showTagline={false} />
          <Link href="/login" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>Sign in instead</Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '28px 16px 56px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '22px' }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ flex: 1, height: '4px', borderRadius: '99px', background: n <= step ? '#14241C' : '#E7E3D8', transition: 'background 0.3s' }} />
            ))}
          </div>

          {step === 1 ? (
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 4px', letterSpacing: 0 }}>{STEP_META.title}</h1>
          ) : (
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 4px', letterSpacing: 0 }}>{STEP_META.title}</h2>
          )}
          <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: '0 0 22px' }}>{STEP_META.sub}</p>

          {step === 1 ? (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #DCE9D7',
              borderRadius: '14px',
              boxShadow: '0 14px 34px rgba(20,36,28,0.08)',
              marginBottom: '16px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <p style={{ color: '#075E3E', fontSize: '10.5px', fontWeight: 900, letterSpacing: '0.08em', margin: '0 0 5px', textTransform: 'uppercase' }}>
                      Launch benefit
                    </p>
                    <p style={{ color: '#14241C', fontSize: '18px', fontWeight: 900, lineHeight: 1.15, margin: 0 }}>
                      Free to start. Premium is included.
                    </p>
                  </div>
                  <span style={{ background: '#EDF3ED', border: '1px solid #CADFCA', borderRadius: '99px', color: '#075E3E', flexShrink: 0, fontSize: '11px', fontWeight: 900, padding: '5px 9px' }}>
                    No payment now
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '10px', marginBottom: '13px' }}>
                  <div>
                    <Label>Native state</Label>
                    <select style={inputStyle} value={form.native_state} onChange={e => {
                      const nextState = e.target.value
                      // Keep a prefilled/typed native place if it exists in the chosen state
                      // (e.g. arriving via /register?native_place=Guntur) instead of wiping it.
                      const options = INDIA_STATES[nextState] || []
                      const match = options.find(d => d.toLowerCase() === form.native_district.trim().toLowerCase())
                      setForm(f => ({ ...f, native_state: nextState, native_district: match || '' }))
                    }}>
                      <option value="">Select state</option>
                      {Object.keys(INDIA_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Native place</Label>
                    {districts.length > 0 ? (
                      <select style={inputStyle} value={form.native_district} onChange={e => set('native_district', e.target.value)} disabled={!form.native_state}>
                        <option value="">Select native place</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <select style={{ ...inputStyle, color: '#94A3B8' }} value="" disabled>
                        <option>Select state first</option>
                      </select>
                    )}
                  </div>
                </div>

                <p style={{ color: '#5E6B62', fontSize: '12.5px', lineHeight: 1.55, margin: '0 0 11px' }}>
                  {selectedDistrict
                    ? districtCount === null
                      ? `Checking founding spots for ${selectedDistrict}...`
                      : foundingRemaining > 0
                        ? `${foundingRemaining.toLocaleString('en-IN')} founding spots still open in ${selectedDistrict}. You get 2 years premium free after signup.`
                        : `Founding spots are full in ${selectedDistrict}; your free profile still includes 3 months premium.`
                    : 'Choose your native place to check district founding spots.'}
                </p>
                <div style={{ height: '7px', background: '#EEF4EA', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(foundingPct, selectedDistrict && districtCount !== null ? 2 : 0)}%`, height: '100%', background: '#075E3E', borderRadius: '99px', transition: 'width 0.35s ease' }} />
                </div>
              </div>
              <div style={{ background: '#FBFAF5', borderTop: '1px solid #EEF0EA', display: 'grid', gap: '8px', padding: '12px 16px' }}>
                {PREMIUM_PERKS.map((perk) => (
                  <div key={perk} style={{ alignItems: 'flex-start', display: 'flex', gap: '8px' }}>
                    <span style={{ alignItems: 'center', background: '#D8EFC9', borderRadius: '50%', color: '#075E3E', display: 'inline-flex', flexShrink: 0, fontSize: '10px', fontWeight: 900, height: '17px', justifyContent: 'center', marginTop: '1px', width: '17px' }}>✓</span>
                    <span style={{ color: '#475569', fontSize: '12px', lineHeight: 1.4 }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedDistrict ? (
            <div style={{ alignItems: 'center', background: '#FFFFFF', border: '1px solid #DCE9D7', borderRadius: '12px', display: 'flex', gap: '10px', marginBottom: '16px', padding: '12px 14px' }}>
              <span style={{ alignItems: 'center', background: '#D8EFC9', borderRadius: '50%', color: '#075E3E', display: 'inline-flex', flexShrink: 0, fontSize: '11px', fontWeight: 900, height: '22px', justifyContent: 'center', width: '22px' }}>✓</span>
              <p style={{ color: '#475569', fontSize: '12.5px', lineHeight: 1.45, margin: 0 }}>
                Native place: <strong style={{ color: '#14241C' }}>{selectedDistrict}</strong>. {foundingApplied ? '2 years premium will be applied.' : 'Premium trial will be applied.'}
              </p>
            </div>
          ) : null}

          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E8E8E8', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '20px' }}>
            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '13.5px', background: '#EDF3ED', color: '#14241C', border: '1px solid #CADFCA' }}>
                {error}
              </div>
            )}

            {/* ── STEP 1: profile owner ─────────────────────────── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px', lineHeight: 1.6 }}>
                    Please select whose profile you are creating.
                  </p>
                  <div style={{ border: '1px solid #E7E3D8', borderRadius: '10px', overflow: 'hidden', background: '#FFFFFF' }}>
                    {[
                      ['self', 'Myself'], ['son', 'Son'], ['daughter', 'Daughter'],
                      ['brother', 'Brother'], ['sister', 'Sister'], ['relative', 'Relative'],
                    ].map(([val, lbl], idx, arr) => (
                      <button key={val} type="button" onClick={() => set('profile_created_by', val)} style={{
                        width: '100%', minHeight: '54px', display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '0 14px', background: 'white', border: 'none',
                        borderBottom: idx < arr.length - 1 ? '1px solid #EEF0EA' : 'none',
                        color: '#071527', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                      }}>
                        <span style={{
                          width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid',
                          borderColor: form.profile_created_by === val ? '#075E3E' : '#CBD5E1',
                          background: form.profile_created_by === val ? '#075E3E' : 'white',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {form.profile_created_by === val && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m20 6-11 11-5-5" />
                            </svg>
                          )}
                        </span>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={continueFromOwnerStep} className="btn-primary" style={{ padding: '13px', fontSize: '15px' }}>
                  Continue
                </button>
              </div>
            )}

            {/* ── STEP 2: basic details + mobile ────────────────── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label>Full name</Label>
                  <input style={inputStyle} placeholder="e.g. Ravi Kumar Reddy" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[['male', 'Male'], ['female', 'Female']].map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => set('gender', val)} style={{
                        padding: '11px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
                        border: '1.5px solid', transition: 'all 0.12s',
                        background: form.gender === val ? '#14241C' : 'white',
                        color: form.gender === val ? 'white' : '#555',
                        borderColor: form.gender === val ? '#14241C' : '#E7E3D8',
                      }}>{lbl}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Date of birth</Label>
                  <input style={inputStyle} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
                <div>
                  <Label>Current city</Label>
                  <input style={inputStyle} placeholder="e.g. Dallas, Hyderabad, Chennai" value={form.current_city} onChange={e => set('current_city', e.target.value)} />
                </div>
                {googleAuth ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EDF3ED', border: '1px solid #CADFCA', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#14241C' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
                    Signed in with Google as <strong>{googleAuth.email}</strong>
                  </div>
                ) : (
                <div>
                  <Label>Mobile number</Label>
                  <div style={{ display: 'flex', border: '1.5px solid #E7E3D8', borderRadius: '8px', overflow: 'hidden' }}>
                    <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                      style={{ background: '#FBFAF5', fontSize: '13px', fontWeight: 600, padding: '11px 8px', border: 'none', outline: 'none', borderRight: '1px solid #E7E3D8', flexShrink: 0 }}>
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <input style={{ flex: 1, padding: '11px 13px', fontSize: '14px', border: 'none', outline: 'none', background: 'white' }}
                      type="tel" placeholder="Mobile number" value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => { if (e.key === 'Enter') sendOtp() }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>We&apos;ll send a verification code. Your number is never shown to members.</p>
                </div>
                )}
                {googleAuth ? (
                  <button onClick={() => { handleSubmit(); try { sessionStorage.removeItem('nm_google') } catch {} }} disabled={loading} className="btn-primary" style={{ padding: '13px', fontSize: '15px', marginTop: '4px' }}>
                    {loading ? 'Creating profile…' : 'Create my profile'}
                  </button>
                ) : (
                  <button onClick={sendOtp} disabled={sending} className="btn-primary" style={{ padding: '13px', fontSize: '15px', marginTop: '4px' }}>
                    {sending ? 'Sending OTP…' : 'Send OTP'}
                  </button>
                )}
              </div>
            )}

            {/* ── STEP 3: OTP ───────────────────────────────────── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#EAF3EA', border: '1px solid #CADFCA', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#14241C' }}>
                  {devOtp
                    ? <>Dev mode - your code is <strong>{devOtp}</strong>. (Real SMS sends automatically once a gateway key is added.)</>
                    : <>We sent a 6-digit code to {phoneCode} {form.phone}. Enter it below.</>}
                </div>
                <div>
                  <Label>Enter 6-digit code</Label>
                  <input ref={otpRef} style={{ ...inputStyle, letterSpacing: '0.5em', textAlign: 'center', fontSize: '20px', fontWeight: 700 }}
                    inputMode="numeric" maxLength={6} placeholder="••••••" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => { if (e.key === 'Enter') verifyOtp() }} />
                </div>
                <button onClick={verifyOtp} disabled={sending} className="btn-primary" style={{ padding: '13px', fontSize: '15px' }}>
                  {sending || loading ? 'Creating profile…' : 'Verify & create profile'}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={() => { setStep(2); setOtp(''); setError(''); setResendIn(0) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#94A3B8' }}>
                    ← Change details
                  </button>
                  {resendIn > 0 ? (
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>Resend OTP in {resendIn}s</span>
                  ) : (
                    <button onClick={() => { if (!sending) { setOtp(''); sendOtp() } }} disabled={sending}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1B5E20', fontSize: '13px', fontWeight: 700 }}>
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', marginTop: '20px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ fontWeight: 600, color: '#14241C', textDecoration: 'none' }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#8A93A6', marginTop: '8px', lineHeight: 1.6 }}>
            Your profile is visible unless you hide it. Contact details are shown only after connection.<br />
            By registering you agree to our{' '}
            <Link href="/terms" style={{ textDecoration: 'underline', color: 'inherit' }}>Terms</Link>
            {' '}&amp;{' '}
            <Link href="/privacy" style={{ textDecoration: 'underline', color: 'inherit' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
