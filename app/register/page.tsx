'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ─── India states & districts ───────────────────────────────── */
const INDIA_STATES: Record<string, string[]> = {
  'Andhra Pradesh':     ['Visakhapatnam','East Godavari','West Godavari','Krishna','Guntur','Prakasam','Nellore','Srikakulam','Vizianagaram','Kurnool','Kadapa','Chittoor','Anantapur','Nandyal','Sri Sathya Sai','Tirupati','Alluri Sitharama Raju','Anakapalli','Kakinada','Konaseema','Eluru','NTR District','Palnadu','Bapatla'],
  'Telangana':          ['Hyderabad','Rangareddy','Medchal','Warangal','Karimnagar','Khammam','Nizamabad','Adilabad','Mahbubnagar','Nalgonda','Siddipet','Yadadri Bhongir','Vikarabad','Sangareddy','Medak','Jagitial','Peddapalli','Rajanna Sircilla','Nirmal','Mancherial','Bhadradri Kothagudem','Suryapet','Mahabubabad','Jangaon','Mulugu'],
  'Karnataka':          ['Bengaluru Urban','Bengaluru Rural','Mysuru','Mangaluru','Hubballi-Dharwad','Belagavi','Kalaburagi','Tumakuru','Shivamogga','Vijayapura','Davangere','Ballari','Raichur','Hassan','Udupi','Chitradurga','Kodagu','Mandya','Bidar','Yadgir','Haveri','Gadag','Bagalkot','Koppal','Chamarajanagar','Chikkaballapura','Chikkamagaluru','Ramanagara','Kolar','Dharwad'],
  'Tamil Nadu':         ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Tiruppur','Vellore','Erode','Thoothukudi','Dindigul','Thanjavur','Cuddalore','Kancheepuram','Chengalpattu','Nagapattinam','Tiruvannamalai','Virudhunagar','Nilgiris','Ranipet','Ariyalur','Perambalur','Pudukkottai','Ramanathapuram','Sivaganga','Tenkasi','Theni','Tirupattur','Tiruvarur','Villupuram','Krishnagiri','Dharmapuri','Namakkal','Karur'],
  'Maharashtra':        ['Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur','Amravati','Kolhapur','Nanded','Sangli','Jalgaon','Akola','Latur','Dhule','Ahmednagar','Chandrapur','Parbhani','Satara','Ratnagiri','Beed','Osmanabad','Nandurbar','Yavatmal','Wardha','Washim','Buldhana','Hingoli','Gondia','Bhandara','Gadchiroli'],
  'Delhi':              ['New Delhi','Central Delhi','North Delhi','South Delhi','East Delhi','West Delhi','North West Delhi','South West Delhi','North East Delhi','Shahdara'],
  'Uttar Pradesh':      ['Lucknow','Kanpur','Agra','Varanasi','Prayagraj','Ghaziabad','Noida','Meerut','Bareilly','Aligarh','Moradabad','Saharanpur','Gorakhpur','Firozabad','Jhansi','Muzaffarnagar','Mathura','Unnao','Ayodhya','Azamgarh','Sultanpur','Rae Bareli','Sitapur','Hardoi','Shahjahanpur','Rampur','Budaun','Bahraich','Gonda','Ballia','Bulandshahr','Bijnor'],
  'Gujarat':            ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Junagadh','Gandhinagar','Anand','Navsari','Morbi','Mehsana','Surendranagar','Bharuch','Kheda','Patan','Valsad','Tapi','Narmada','Porbandar','Amreli','Botad','Kutch','Sabarkantha','Dang','Chhota Udaipur','Devbhoomi Dwarka','Gir Somnath'],
  'Rajasthan':          ['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara','Alwar','Bharatpur','Sikar','Pali','Sri Ganganagar','Tonk','Barmer','Jhalawar','Banswara','Hanumangarh','Nagaur','Chittorgarh','Dausa','Sawai Madhopur','Baran','Jhunjhunu','Dungarpur','Jalore','Sirohi','Karauli','Dholpur'],
  'West Bengal':        ['Kolkata','Howrah','Asansol','Siliguri','Durgapur','Bardhaman','Malda','Baharampur','Kharagpur','Raiganj','Krishnanagar','Jalpaiguri','Darjeeling','Bankura','Purulia','Cooch Behar','Murshidabad','Nadia','South 24 Parganas','North 24 Parganas','Hooghly','Paschim Medinipur','Purba Medinipur'],
  'Madhya Pradesh':     ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Ratlam','Rewa','Singrauli','Burhanpur','Khandwa','Bhind','Chhindwara','Guna','Shivpuri','Vidisha','Chhatarpur','Damoh','Mandsaur','Khargone','Neemuch','Hoshangabad','Itarsi','Sehore','Betul','Seoni','Datia'],
  'Punjab':             ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Hoshiarpur','Batala','Pathankot','Moga','Muktsar','Barnala','Rajpura','Firozpur','Kapurthala','Sangrur','Faridkot','Gurdaspur','Ropar','Nawanshahr','Tarn Taran','Fatehgarh Sahib','Mansa','Fazilka'],
  'Haryana':            ['Faridabad','Gurugram','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat','Panchkula','Bhiwani','Jind','Sirsa','Kaithal','Rewari','Palwal','Fatehabad','Mahendragarh','Nuh','Charkhi Dadri'],
  'Bihar':              ['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Bihar Sharif','Arrah','Begusarai','Katihar','Munger','Chhapra','Hajipur','Siwan','Motihari','Nawada','Buxar','Kishanganj','Sitamarhi','Aurangabad','Supaul','Saharsa','Sasaram'],
  'Odisha':             ['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri','Balasore','Bhadrak','Baripada','Jharsuguda','Bargarh','Jeypore','Angul','Dhenkanal','Kendrapara','Jajpur','Rayagada','Koraput','Phulbani','Keonjhar','Bolangir','Sundargarh'],
  'Kerala':             ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Alappuzha','Kottayam','Kannur','Kasaragod','Idukki','Malappuram','Pathanamthitta','Wayanad'],
  'Jharkhand':          ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribag','Giridih','Ramgarh','Chaibasa','Chakradharpur'],
  'Assam':              ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur','Bongaigaon','Dhubri','North Lakhimpur','Karimganj','Sivasagar','Goalpara','Barpeta','Golaghat','Hailakandi'],
  'Uttarakhand':        ['Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Kashipur','Rishikesh','Kotdwar','Ramnagar','Tehri','Almora','Nainital','Pithoragarh','Chamoli'],
  'Himachal Pradesh':   ['Shimla','Mandi','Solan','Dharamshala','Baddi','Nahan','Paonta Sahib','Sundarnagar','Kullu','Una','Hamirpur','Bilaspur','Chamba','Kangra'],
  'Chhattisgarh':       ['Raipur','Bhilai','Korba','Bilaspur','Durg','Rajnandgaon','Jagdalpur','Raigarh','Ambikapur','Mahasamund','Dhamtari'],
  'Goa':                ['North Goa','South Goa'],
  'Tripura':            ['Agartala','Dharmanagar','Udaipur','Kailasahar','Belonia'],
  'Manipur':            ['Imphal West','Imphal East','Thoubal','Bishnupur','Churachandpur'],
  'Meghalaya':          ['East Khasi Hills (Shillong)','West Garo Hills (Tura)','Jaintia Hills'],
  'J&K':                ['Srinagar','Jammu','Anantnag','Baramulla','Udhampur','Kathua'],
  'Ladakh':             ['Leh','Kargil'],
  'Puducherry':         ['Puducherry','Karaikal','Mahe','Yanam'],
  'Other / Abroad':     ['USA','UK','Canada','Australia','UAE','Singapore','New Zealand','Germany','Other'],
}

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

/* ─── Main ───────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter()
  // step: 1 = identity, 2 = OTP, 3 = quick mandatory details
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneCode, setPhoneCode] = useState('+91')
  const [otp, setOtp] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [devOtp, setDevOtp] = useState('')   // shown only in dev mode (no SMS key)
  const [sending, setSending] = useState(false)
  const otpRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name: '', gender: '', phone: '',
    date_of_birth: '', native_state: '', native_district: '',
  })
  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (id) router.replace(`/profile/${id}`)
  }, [])

  useEffect(() => { if (step === 2) setTimeout(() => otpRef.current?.focus(), 100) }, [step])

  const districts = form.native_state ? (INDIA_STATES[form.native_state] || []) : []

  /* Step 1 → send a real OTP (dev mode returns the code in the response) */
  async function sendOtp() {
    if (!form.full_name.trim()) return setError('Please enter your name')
    if (!form.gender) return setError('Please select gender')
    if (form.phone.trim().length < 7) return setError('Enter a valid mobile number')
    setError(''); setSending(true)
    try {
      const fullPhone = `${phoneCode}${form.phone.trim()}`
      const res = await fetch('/api/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send code')
      setOtpToken(data.token)
      setDevOtp(data.dev_otp || '')   // present only when no SMS gateway configured
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code')
    } finally { setSending(false) }
  }

  /* Step 2 → verify the OTP server-side */
  async function verifyOtp() {
    if (otp.trim().length < 4) return setError('Enter the 6-digit code')
    setError(''); setSending(true)
    try {
      const fullPhone = `${phoneCode}${form.phone.trim()}`
      const res = await fetch('/api/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otp.trim(), token: otpToken, phone: fullPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Incorrect code')
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect code')
    } finally { setSending(false) }
  }

  /* Step 3 → create the minimal profile and go inside */
  async function handleSubmit() {
    if (!form.date_of_birth) return setError('Date of birth is required')
    if (!form.native_state) return setError('Please select your native state')
    if (!form.native_district) return setError('Please select your native district')
    setLoading(true); setError('')
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      // Server re-verifies the OTP, creates the account, and sets the session cookie.
      const fullPhone = `${phoneCode}${form.phone.trim()}`
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name, gender: form.gender, phone: fullPhone,
          date_of_birth: form.date_of_birth, native_state: form.native_state,
          native_district: form.native_district, otp: otp.trim(), token: otpToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      localStorage.setItem('my_user_id', data.userId)
      localStorage.setItem('my_profile_id', data.profileId)
      router.push('/browse?new=1')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const STEP_META = [
    { n: 1, title: 'Create your account', sub: 'Takes less than a minute' },
    { n: 2, title: 'Verify your mobile', sub: `We sent a code to ${phoneCode} ${form.phone}` },
    { n: 3, title: 'A few quick details', sub: 'The rest you can add anytime from your profile' },
  ][step - 1]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBFAF5' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: '20px', letterSpacing: '-0.03em' }}>
              <span style={{ fontWeight: 700, color: '#14241C' }}>native</span><span style={{ fontWeight: 400, color: '#1B5E20' }}>matrimony</span><span style={{ fontWeight: 700, color: '#1B5E20' }}>.</span>
            </span>
          </Link>
          <Link href="/login" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>Sign in instead</Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px 60px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '22px' }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ flex: 1, height: '4px', borderRadius: '99px', background: n <= step ? '#14241C' : '#E7E3D8', transition: 'background 0.3s' }} />
            ))}
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{STEP_META.title}</h2>
          <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: '0 0 22px' }}>{STEP_META.sub}</p>

          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '24px' }}>
            {error && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '13.5px', background: '#EDF3ED', color: '#14241C', border: '1px solid #CADFCA' }}>
                {error}
              </div>
            )}

            {/* ── STEP 1: identity + mobile ─────────────────────── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label>Full name</Label>
                  <input style={inputStyle} placeholder="e.g. Ravi Kumar Reddy" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div>
                  <Label>I am a</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[['male', 'Groom (Male)'], ['female', 'Bride (Female)']].map(([val, lbl]) => (
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
                <button onClick={sendOtp} disabled={sending} className="btn-primary" style={{ padding: '13px', fontSize: '15px', marginTop: '4px' }}>
                  {sending ? 'Sending code…' : 'Send verification code →'}
                </button>
              </div>
            )}

            {/* ── STEP 2: OTP ───────────────────────────────────── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#EAF3EA', border: '1px solid #CADFCA', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#14241C' }}>
                  {devOtp
                    ? <>Dev mode — your code is <strong>{devOtp}</strong>. (Real SMS sends automatically once a gateway key is added.)</>
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
                  {sending ? 'Verifying…' : 'Verify & continue →'}
                </button>
                <button onClick={() => { setStep(1); setOtp(''); setError('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#94A3B8' }}>
                  ← Change mobile number
                </button>
              </div>
            )}

            {/* ── STEP 3: quick mandatory details ───────────────── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label>Date of birth</Label>
                  <input style={inputStyle} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
                <div>
                  <Label>Native state</Label>
                  <select style={inputStyle} value={form.native_state} onChange={e => { set('native_state', e.target.value); set('native_district', '') }}>
                    <option value="">Select state</option>
                    {Object.keys(INDIA_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Native district</Label>
                  {districts.length > 0 ? (
                    <select style={inputStyle} value={form.native_district} onChange={e => set('native_district', e.target.value)} disabled={!form.native_state}>
                      <option value="">Select district</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input style={inputStyle} placeholder="Type your district / city" value={form.native_district} onChange={e => set('native_district', e.target.value)} />
                  )}
                </div>
                <div style={{ background: '#ECFDF5', borderRadius: '10px', padding: '12px 14px', border: '1px solid #A7F3D0' }}>
                  <p style={{ fontSize: '12px', color: '#065F46', margin: 0, lineHeight: 1.5 }}>
                    That&apos;s all we need to get you started. Add your photo, profession, and more later — your profile bar will guide you.
                  </p>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: '13px', fontSize: '15px' }}>
                  {loading ? 'Creating your profile…' : 'Enter NativeMatrimony →'}
                </button>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', marginTop: '20px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ fontWeight: 600, color: '#14241C', textDecoration: 'none' }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#C4C4C4', marginTop: '8px' }}>
            Free access to all features until 30 September 2026<br />
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
