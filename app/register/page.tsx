'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: 'test2@natiive.com',
    password: 'Test@1234',
    full_name: 'Ravi Kumar',
    gender: 'male',
    date_of_birth: '1995-06-15',
    phone: '9876543210',
    profession: 'Software Engineer',
    education: 'B.Tech',
    about: 'Looking for a life partner from native place.',
    native_region: 'Coastal Andhra',
    native_state: 'Andhra Pradesh',
    native_district: 'Krishna',
    current_city: 'Hyderabad',
    current_state: 'Telangana',
    height_cm: '175',
    religion: 'Hindu',
    caste: 'Kamma',
    mother_tongue: 'Telugu',
    family_type: 'nuclear',
  })

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const availableStates = form.native_region ? Object.keys(REGIONS[form.native_region] || {}) : []
  const availableDistricts = form.native_state ? (REGIONS[form.native_region]?.[form.native_state] || []) : []

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      // Generate a temporary UUID for testing (auth will be added later)
      const userId = crypto.randomUUID()

      // 2. Upload photo
      let photoUrl = ''
      if (photo) {
        const ext = photo.name.split('.').pop()
        const fileName = `${userId}/main.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, photo)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }

      // 3. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        full_name: form.full_name,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        phone: form.phone,
        email: form.email,
        profession: form.profession,
        education: form.education,
        about: form.about,
        native_region: form.native_region,
        native_state: form.native_state,
        native_district: form.native_district,
        current_city: form.current_city,
        current_state: form.current_state,
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        religion: form.religion,
        caste: form.caste,
        mother_tongue: form.mother_tongue,
        family_type: form.family_type,
        status: 'pending',
        verified: false,
      })
      if (profileError) throw profileError

      router.push('/pending')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-orange-700 mb-1">Create Your Profile</h1>
        <p className="text-gray-500 mb-6">Step {step} of 3</p>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-orange-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">Account & Basic Info</h2>
            <input className="input" placeholder="Full Name *" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            <input className="input" type="email" placeholder="Email *" value={form.email} onChange={e => set('email', e.target.value)} />
            <input className="input" type="password" placeholder="Password *" value={form.password} onChange={e => set('password', e.target.value)} />
            <input className="input" type="tel" placeholder="Phone number" value={form.phone} onChange={e => set('phone', e.target.value)} />
            <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Select Gender *</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <div>
              <label className="text-sm text-gray-600">Date of Birth *</label>
              <input className="input mt-1" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">Native Place & Location</h2>
            <select className="input" value={form.native_region} onChange={e => { set('native_region', e.target.value); set('native_state', ''); set('native_district', '') }}>
              <option value="">Select Native Region *</option>
              {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="input" value={form.native_state} onChange={e => { set('native_state', e.target.value); set('native_district', '') }} disabled={!form.native_region}>
              <option value="">Select State *</option>
              {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input" value={form.native_district} onChange={e => set('native_district', e.target.value)} disabled={!form.native_state}>
              <option value="">Select Native District *</option>
              {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input className="input" placeholder="Current City *" value={form.current_city} onChange={e => set('current_city', e.target.value)} />
            <input className="input" placeholder="Current State *" value={form.current_state} onChange={e => set('current_state', e.target.value)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">Profession & Photo</h2>
            <input className="input" placeholder="Profession *" value={form.profession} onChange={e => set('profession', e.target.value)} />
            <input className="input" placeholder="Education" value={form.education} onChange={e => set('education', e.target.value)} />
            <input className="input" placeholder="Caste" value={form.caste} onChange={e => set('caste', e.target.value)} />
            <input className="input" placeholder="Height (cm)" type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
            <select className="input" value={form.family_type} onChange={e => set('family_type', e.target.value)}>
              <option value="">Family Type</option>
              <option value="nuclear">Nuclear</option>
              <option value="joint">Joint</option>
            </select>
            <textarea className="input" rows={3} placeholder="About yourself" value={form.about} onChange={e => set('about', e.target.value)} />

            <div>
              <label className="text-sm text-gray-600 font-medium">Profile Photo *</label>
              <input type="file" accept="image/*" className="mt-2 block w-full text-sm text-gray-500" onChange={e => {
                const file = e.target.files?.[0]
                if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)) }
              }} />
              {photoPreview && <img src={photoPreview} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded-lg" />}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="ml-auto px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="ml-auto px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
