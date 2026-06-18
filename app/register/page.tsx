'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

const STEPS = ['Basic Info', 'Native Place', 'Profession & Photo']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', gender: '',
    date_of_birth: '', phone: '', profession: '', education: '',
    about: '', native_region: '', native_state: '', native_district: '',
    current_city: '', current_state: '', height_cm: '',
    religion: 'Hindu', caste: '', mother_tongue: 'Telugu', family_type: '',
  })

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const availableStates = form.native_region ? Object.keys(REGIONS[form.native_region] || {}) : []
  const availableDistricts = form.native_state ? (REGIONS[form.native_region]?.[form.native_state] || []) : []

  function validateStep(s: number): string {
    if (s === 1) {
      if (!form.full_name.trim()) return 'Full name is required'
      if (!form.email.trim()) return 'Email is required'
      if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters'
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
      if (!photo) return 'Please upload a profile photo'
    }
    return ''
  }

  async function handleSubmit() {
    const err = validateStep(3)
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    try {
      // Create Supabase auth account
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
        phone: form.phone, email: form.email, profession: form.profession,
        education: form.education, about: form.about, native_region: form.native_region,
        native_state: form.native_state, native_district: form.native_district,
        current_city: form.current_city, current_state: form.current_state,
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        religion: form.religion, caste: form.caste, mother_tongue: form.mother_tongue,
        family_type: form.family_type, photo_url: photoUrl, status: 'pending', verified: false,
      }).select('id').single()
      if (profileError) throw profileError
      localStorage.setItem('my_user_id', userId)
      if (profileData?.id) localStorage.setItem('my_profile_id', profileData.id)
      router.push('/pending')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{background: '#FFF7ED'}}>
      {/* Header */}
      <header style={{background: 'white', borderBottom: '1px solid #E7E5E4'}}>
        <div className="max-w-xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-base font-bold text-stone-900">
            Natiive<span className="text-orange-700">Matrimony</span>
          </Link>
          <Link href="/browse" className="text-sm text-stone-500 hover:text-orange-700">Browse profiles</Link>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i + 1 < step ? 'bg-orange-700 text-white' : i + 1 === step ? 'bg-orange-700 text-white' : 'bg-stone-200 text-stone-400'}`}>
                      {i + 1 < step ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-stone-800' : 'text-stone-400'}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-orange-700' : 'bg-stone-200'}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-stone-900 mb-1">{STEPS[step - 1]}</h2>
            <p className="text-sm text-stone-500 mb-6">Step {step} of {STEPS.length}</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{background: '#FEE2E2', color: '#991B1B'}}>
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="section-label block mb-1.5">Full Name *</label>
                  <input className="input" placeholder="e.g. Ravi Kumar" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Email *</label>
                  <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Password *</label>
                  <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Phone</label>
                  <input className="input" type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="section-label block mb-1.5">Gender *</label>
                    <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Date of Birth *</label>
                    <input className="input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="section-label block mb-1.5">Native Region *</label>
                  <select className="input" value={form.native_region} onChange={e => { set('native_region', e.target.value); set('native_state', ''); set('native_district', '') }}>
                    <option value="">Select region</option>
                    {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="section-label block mb-1.5">Native State *</label>
                  <select className="input" value={form.native_state} onChange={e => { set('native_state', e.target.value); set('native_district', '') }} disabled={!form.native_region}>
                    <option value="">Select state</option>
                    {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="section-label block mb-1.5">Native District *</label>
                  <select className="input" value={form.native_district} onChange={e => set('native_district', e.target.value)} disabled={!form.native_state}>
                    <option value="">Select district</option>
                    {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="section-label block mb-1.5">Current City *</label>
                    <input className="input" placeholder="e.g. Hyderabad" value={form.current_city} onChange={e => set('current_city', e.target.value)} />
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Current State</label>
                    <input className="input" placeholder="e.g. Telangana" value={form.current_state} onChange={e => set('current_state', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="section-label block mb-1.5">Profession *</label>
                  <input className="input" placeholder="e.g. Software Engineer" value={form.profession} onChange={e => set('profession', e.target.value)} />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Education</label>
                  <input className="input" placeholder="e.g. B.Tech, MBA" value={form.education} onChange={e => set('education', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="section-label block mb-1.5">Caste</label>
                    <input className="input" placeholder="Optional" value={form.caste} onChange={e => set('caste', e.target.value)} />
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Height (cm)</label>
                    <input className="input" type="number" placeholder="e.g. 170" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="section-label block mb-1.5">Family Type</label>
                  <select className="input" value={form.family_type} onChange={e => set('family_type', e.target.value)}>
                    <option value="">Select</option>
                    <option value="nuclear">Nuclear</option>
                    <option value="joint">Joint</option>
                  </select>
                </div>
                <div>
                  <label className="section-label block mb-1.5">About yourself</label>
                  <textarea className="input" rows={3} placeholder="A short note about yourself, family background, expectations..." value={form.about} onChange={e => set('about', e.target.value)} />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Profile Photo *</label>
                  <div className="flex items-center gap-4">
                    {photoPreview && (
                      <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-orange-200" />
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-stone-300 rounded-lg text-sm text-stone-500 cursor-pointer hover:border-orange-400 hover:text-orange-600 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {photo ? photo.name : 'Upload photo'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)) }
                      }} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6" style={{borderTop: '1px solid #F5F5F4'}}>
              {step > 1 ? (
                <button onClick={() => { setError(''); setStep(s => s - 1) }} className="btn-outline px-5 py-2.5 text-sm">Back</button>
              ) : <div />}
              {step < 3 ? (
                <button onClick={() => {
                  const err = validateStep(step)
                  if (err) { setError(err); return }
                  setError(''); setStep(s => s + 1)
                }} className="btn-primary px-5 py-2.5 text-sm">Continue</button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
