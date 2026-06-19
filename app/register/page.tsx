'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BiodataUploader from '../components/BiodataUploader'

const REGIONS: Record<string, Record<string, string[]>> = {
  'Coastal Andhra': {
    'Andhra Pradesh': ['Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore'],
  },
  'Rayalaseema': {
    'Andhra Pradesh': ['Kurnool', 'Kadapa', 'Chittoor', 'Anantapur'],
  },
  'Telangana': {
    'Telangana': ['Hyderabad', 'Rangareddy', 'Medchal', 'Warangal', 'Karimnagar', 'Khammam', 'Nizamabad', 'Adilabad', 'Mahbubnagar', 'Nalgonda'],
  },
}

const STEPS = ['Basic Info', 'Native Place', 'About You']

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
  { code: '+968', label: '🇴🇲 +968' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneCode, setPhoneCode] = useState('+91')

  // Redirect already-logged-in users away from the register page
  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (id) router.replace(`/profile/${id}`)
  }, [])

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', full_name: '', gender: '',
    date_of_birth: '', phone: '', profession: '', education: '',
    about: '', native_region: '', native_state: '', native_district: '',
    current_city: '', current_state: '', height_cm: '',
    religion: 'Hindu', caste: '', mother_tongue: 'Telugu', family_type: '',
  })

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [biodataParsed, setBiodataParsed] = useState(false)

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const availableStates = form.native_region ? Object.keys(REGIONS[form.native_region] || {}) : []
  const availableDistricts = form.native_state ? (REGIONS[form.native_region]?.[form.native_state] || []) : []

  function validateStep(s: number): string {
    if (s === 1) {
      if (!form.full_name.trim()) return 'Full name is required'
      if (!form.email.trim()) return 'Email is required'
      if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters'
      if (form.password !== form.confirmPassword) return 'Passwords do not match'
      if (!form.gender) return 'Please select gender'
      if (!form.date_of_birth) return 'Date of birth is required'
    }
    if (s === 2) {
      if (!form.native_region) return 'Please select native region'
      if (!form.native_state) return 'Please select state'
      if (!form.native_district) return 'Please select district'
      if (!form.current_city.trim()) return 'Current city is required'
    }
    if (s === 3) {
      if (!form.profession.trim()) return 'Profession is required'
    }
    return ''
  }

  async function handleSubmit() {
    const err = validateStep(3)
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    // Clear any previous session before creating a new one
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if (authError) throw authError
      const userId = authData.user?.id
      if (!userId) throw new Error('Signup failed — no user ID returned')

      let photoUrl = ''
      if (photo) {
        const ext = photo.name.split('.').pop()
        const fileName = `${userId}/main.${ext}`
        const { error: uploadError } = await supabase.storage.from('profile-photos').upload(fileName, photo)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }

      const { data: profileData, error: profileError } = await supabase.from('profiles').insert({
        user_id: userId, full_name: form.full_name, gender: form.gender, date_of_birth: form.date_of_birth,
        phone: form.phone ? `${phoneCode} ${form.phone.trim()}` : '', email: form.email, profession: form.profession,
        education: form.education, about: form.about, native_region: form.native_region,
        native_state: form.native_state, native_district: form.native_district,
        current_city: form.current_city, current_state: form.current_state,
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        religion: form.religion, caste: form.caste, mother_tongue: form.mother_tongue,
        family_type: form.family_type, photo_url: photoUrl,
        status: 'approved', verified: false,
        premium_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).select('id').maybeSingle()
      if (profileError) throw profileError

      localStorage.setItem('my_user_id', userId)
      if (profileData?.id) localStorage.setItem('my_profile_id', profileData.id)
      router.push('/profile/edit?new=1')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="form-label">{children}</label>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF9' }}>
      <header className="bg-white border-b" style={{ borderColor: '#E8E0D6' }}>
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-stone-900 font-serif-display">
            Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
          </Link>
          <Link href="/browse" className="text-sm text-stone-500 hover:text-stone-700">Browse profiles</Link>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Biodata auto-fill */}
          <div className="mb-5">
            <BiodataUploader onParsed={data => {
              const districtToRegion: Record<string, { region: string; state: string }> = {}
              Object.entries(REGIONS).forEach(([region, states]) => {
                Object.entries(states).forEach(([state, districts]) => {
                  districts.forEach(d => { districtToRegion[d.toLowerCase()] = { region, state } })
                })
              })
              const nd = String(data.native_district || '').trim()
              const regionInfo = districtToRegion[nd.toLowerCase()]
              setForm(f => ({
                ...f,
                ...(data.full_name ? { full_name: String(data.full_name) } : {}),
                ...(data.gender ? { gender: String(data.gender) } : {}),
                ...(data.date_of_birth ? { date_of_birth: String(data.date_of_birth) } : {}),
                ...(data.religion ? { religion: String(data.religion) } : {}),
                ...(data.caste ? { caste: String(data.caste) } : {}),
                ...(data.mother_tongue ? { mother_tongue: String(data.mother_tongue) } : {}),
                ...(data.education ? { education: String(data.education) } : {}),
                ...(data.profession ? { profession: String(data.profession) } : {}),
                ...(data.height_cm ? { height_cm: String(data.height_cm) } : {}),
                ...(data.native_district ? { native_district: nd } : {}),
                ...(regionInfo ? { native_region: regionInfo.region, native_state: regionInfo.state } : {}),
                ...(data.current_city ? { current_city: String(data.current_city) } : {}),
                ...(data.current_state ? { current_state: String(data.current_state) } : {}),
                ...(data.about ? { about: String(data.about).slice(0, 400) } : {}),
              }))
              setBiodataParsed(true)
            }} />
            {biodataParsed && (
              <p className="text-xs text-center text-stone-400 mt-2">
                Fields filled — complete remaining details below then create your account
              </p>
            )}
          </div>

          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex items-center">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      i + 1 < step ? 'text-white' : i + 1 === step ? 'text-white' : 'text-stone-400'
                    }`} style={{
                      background: i + 1 <= step ? '#B45309' : '#E8E0D6'
                    }}>
                      {i + 1 < step ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-stone-700' : 'text-stone-400'}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-3" style={{ background: i + 1 < step ? '#B45309' : '#E8E0D6' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-stone-900 font-serif-display">{STEPS[step - 1]}</h2>
              <p className="text-sm text-stone-400 mt-0.5">Step {step} of {STEPS.length}</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Gender</Label>
                    <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Select</option>
                      <option value="male">Male (Groom)</option>
                      <option value="female">Female (Bride)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Date of birth</Label>
                    <input className="input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Full name</Label>
                  <input className="input" placeholder="e.g. Ravi Kumar" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div>
                  <Label>Mobile number</Label>
                  <div className="flex rounded-lg overflow-hidden" style={{border: '1.5px solid var(--border)'}}>
                    <select
                      value={phoneCode}
                      onChange={e => setPhoneCode(e.target.value)}
                      className="bg-stone-50 text-sm font-medium text-stone-700 px-2 py-2.5 border-r outline-none shrink-0"
                      style={{borderColor: 'var(--border)'}}>
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <input
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                      type="tel"
                      placeholder="Mobile number"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
                <div>
                  <Label>Email address</Label>
                  <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <Label>Password</Label>
                  <input className="input" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div>
                  <Label>Confirm password <span className="text-red-500">*</span></Label>
                  <input className="input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Native region</Label>
                  <select className="input" value={form.native_region} onChange={e => { set('native_region', e.target.value); set('native_state', ''); set('native_district', '') }}>
                    <option value="">Select region</option>
                    {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Native state</Label>
                  <select className="input" value={form.native_state} onChange={e => { set('native_state', e.target.value); set('native_district', '') }} disabled={!form.native_region}>
                    <option value="">Select state</option>
                    {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Native district</Label>
                  <select className="input" value={form.native_district} onChange={e => set('native_district', e.target.value)} disabled={!form.native_state}>
                    <option value="">Select district</option>
                    {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Current city</Label>
                    <input className="input" placeholder="e.g. Hyderabad" value={form.current_city} onChange={e => set('current_city', e.target.value)} />
                  </div>
                  <div>
                    <Label>Current state</Label>
                    <input className="input" placeholder="e.g. Telangana" value={form.current_state} onChange={e => set('current_state', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Profession</Label>
                  <input className="input" placeholder="e.g. Software Engineer" value={form.profession} onChange={e => set('profession', e.target.value)} />
                </div>
                <div>
                  <Label>Education</Label>
                  <input className="input" placeholder="e.g. B.Tech, MBA" value={form.education} onChange={e => set('education', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Caste</Label>
                    <input className="input" placeholder="Optional" value={form.caste} onChange={e => set('caste', e.target.value)} />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <input className="input" type="number" placeholder="e.g. 170" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Mother tongue</Label>
                    <select className="input" value={form.mother_tongue} onChange={e => set('mother_tongue', e.target.value)}>
                      <option value="Telugu">Telugu</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Family type</Label>
                    <select className="input" value={form.family_type} onChange={e => set('family_type', e.target.value)}>
                      <option value="">Select</option>
                      <option value="nuclear">Nuclear</option>
                      <option value="joint">Joint</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>About yourself</Label>
                  <textarea className="input" rows={3}
                    placeholder="A short note about yourself, family background, what you're looking for..."
                    value={form.about} onChange={e => set('about', e.target.value)} />
                </div>
                <div>
                  <Label>Profile photo</Label>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors"
                    style={{ borderColor: photo ? '#B45309' : '#E8E0D6' }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FEF9EC' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                        </div>
                      )
                    }
                    <div>
                      <p className="text-sm font-medium text-stone-700">{photo ? photo.name : 'Upload a photo'}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Visible only after a mutual match</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)) }
                    }} />
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-7 pt-5 border-t" style={{ borderColor: '#F0EBE3' }}>
              {step > 1 ? (
                <button onClick={() => { setError(''); setStep(s => s - 1) }} className="btn-ghost px-5 py-2.5 text-sm">Back</button>
              ) : <div />}
              {step < 3 ? (
                <button onClick={() => {
                  const err = validateStep(step)
                  if (err) { setError(err); return }
                  setError(''); setStep(s => s + 1)
                }} className="btn-primary px-6 py-2.5 text-sm">Continue</button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="btn-primary px-6 py-2.5 text-sm">
                  {loading ? 'Creating profile...' : 'Create Profile'}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-stone-400 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#B45309' }}>Sign in</Link>
          </p>
          <p className="text-center text-xs text-stone-400 mt-2">
            Free access to all features until 30 September 2026
          </p>
        </div>
      </div>
    </div>
  )
}
