'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BiodataUploader from '../../components/BiodataUploader'
import AppHeader from '../../components/AppHeader'

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

type PhotoVisibility = 'public' | 'after_interest' | 'after_match' | 'hidden'

const VISIBILITY_OPTIONS: { value: PhotoVisibility; label: string; desc: string }[] = [
  { value: 'public', label: 'Always visible', desc: 'Anyone browsing can see your photo' },
  { value: 'after_interest', label: 'After interest', desc: 'Visible once an interest is sent or received' },
  { value: 'after_match', label: 'After match only', desc: 'Visible only after both sides accept (default)' },
  { value: 'hidden', label: 'Hidden', desc: 'Photo never shown — only initials displayed' },
]

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

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="form-label">{children}</label>
)

export default function EditProfilePage() {
  const router = useRouter()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // OTP / identity verification
  const [verified, setVerified] = useState(false)
  // Phone OTP
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtpToken, setPhoneOtpToken] = useState('')
  const [phoneOtpCode, setPhoneOtpCode] = useState('')
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false)
  const [phoneOtpError, setPhoneOtpError] = useState('')
  const [devOtp, setDevOtp] = useState('')
  // Email OTP (kept as fallback)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const [phoneCode, setPhoneCode] = useState('+91')

  // Photo
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('')
  // Additional photos (up to 4 more)
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([])
  const [uploadingExtra, setUploadingExtra] = useState(false)

  const [form, setForm] = useState({
    full_name: '', gender: '', date_of_birth: '', phone: '',
    birth_time: '', birth_place: '',
    profession: '', company: '', annual_income: '', visa_status: '',
    education: '', about: '',
    native_region: '', native_state: '', native_district: '',
    current_city: '', current_state: '',
    height_cm: '', caste: '', mother_tongue: 'Telugu',
    family_type: '', religion: 'Hindu',
    marital_status: 'never_married',
    profile_created_by: 'self',
    father_name: '', father_occupation: '',
    mother_name: '', mother_occupation: '',
    siblings: '', siblings_married: '',
    star: '', rashi: '', gotra: '', manglik: '',
    diet: '', smoking: '', drinking: '',
    pref_age_min: '21', pref_age_max: '35',
    photo_visibility: 'after_match' as PhotoVisibility,
  })

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const availableStates = form.native_region ? Object.keys(REGIONS[form.native_region] || {}) : []
  const availableDistricts = form.native_state ? (REGIONS[form.native_region]?.[form.native_state] || []) : []

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (!id) { router.push('/login'); return }
    setProfileId(id)
    loadProfile(id)
  }, [])

  async function loadProfile(id: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error || !data) { router.push('/browse'); return }
    const rawPhone = data.phone || ''
    if (rawPhone.startsWith('+')) {
      const spaceIdx = rawPhone.indexOf(' ')
      if (spaceIdx > 0) {
        setPhoneCode(rawPhone.slice(0, spaceIdx))
        // digits stored into form.phone below
      }
    }
    setForm({
      full_name: data.full_name || '',
      gender: data.gender || '',
      date_of_birth: data.date_of_birth || '',
      phone: rawPhone.startsWith('+') && rawPhone.indexOf(' ') > 0
        ? rawPhone.slice(rawPhone.indexOf(' ') + 1)
        : rawPhone,
      birth_time: data.birth_time || '',
      birth_place: data.birth_place || '',
      profession: data.profession || '',
      company: data.company || '',
      annual_income: data.annual_income || '',
      visa_status: data.visa_status || '',
      education: data.education || '',
      about: data.about || '',
      native_region: data.native_region || '',
      native_state: data.native_state || '',
      native_district: data.native_district || '',
      current_city: data.current_city || '',
      current_state: data.current_state || '',
      height_cm: data.height_cm ? String(data.height_cm) : '',
      caste: data.caste || '',
      mother_tongue: data.mother_tongue || 'Telugu',
      family_type: data.family_type || '',
      religion: data.religion || 'Hindu',
      father_name: data.father_name || '',
      father_occupation: data.father_occupation || '',
      mother_name: data.mother_name || '',
      mother_occupation: data.mother_occupation || '',
      siblings: data.siblings || '',
      siblings_married: data.siblings_married || '',
      star: data.star || '',
      rashi: data.rashi || '',
      gotra: data.gotra || '',
      manglik: data.manglik || '',
      diet: data.diet || '',
      smoking: data.smoking || '',
      drinking: data.drinking || '',
      marital_status: data.marital_status || 'never_married',
      profile_created_by: data.profile_created_by || 'self',
      pref_age_min: data.pref_age_min ? String(data.pref_age_min) : '21',
      pref_age_max: data.pref_age_max ? String(data.pref_age_max) : '35',
      photo_visibility: (data.photo_visibility as PhotoVisibility) || 'after_match',
    })
    setCurrentPhotoUrl(data.photo_url || '')
    setVerified(data.phone_verified || false)
    // Load additional photos
    const { data: extraPhotos } = await supabase
      .from('profile_photos').select('url').eq('profile_id', id).order('position')
    setAdditionalPhotos((extraPhotos || []).map(p => p.url))
    setUserEmail(data.email || '')
    setLoading(false)
  }


  async function handleSave() {
    if (!profileId) return
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      let photoUrl = currentPhotoUrl
      if (photo) {
        const ext = photo.name.split('.').pop()
        const { error: upErr } = await supabase.storage.from('profile-photos')
          .upload(`${profileId}/main.${ext}`, photo, { upsert: true })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(`${profileId}/main.${ext}`)
        photoUrl = urlData.publicUrl
      }

      const coreFields = {
        full_name: form.full_name.trim(),
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        phone: form.phone.trim() ? `${phoneCode} ${form.phone.trim()}` : '',
        birth_time: form.birth_time.trim(),
        birth_place: form.birth_place.trim(),
        profession: form.profession.trim(),
        company: form.company.trim(),
        annual_income: form.annual_income,
        visa_status: form.visa_status.trim(),
        education: form.education.trim(),
        about: form.about.trim(),
        native_region: form.native_region,
        native_state: form.native_state,
        native_district: form.native_district,
        current_city: form.current_city.trim(),
        current_state: form.current_state.trim(),
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        caste: form.caste.trim(),
        mother_tongue: form.mother_tongue,
        family_type: form.family_type,
        religion: form.religion.trim(),
        father_name: form.father_name.trim(),
        father_occupation: form.father_occupation.trim(),
        mother_name: form.mother_name.trim(),
        mother_occupation: form.mother_occupation.trim(),
        siblings: form.siblings.trim(),
        siblings_married: form.siblings_married,
        star: form.star.trim(),
        rashi: form.rashi.trim(),
        gotra: form.gotra.trim(),
        manglik: form.manglik,
        diet: form.diet,
        smoking: form.smoking,
        drinking: form.drinking,
        marital_status: form.marital_status,
        profile_created_by: form.profile_created_by,
        pref_age_min: form.pref_age_min ? parseInt(form.pref_age_min) : null,
        pref_age_max: form.pref_age_max ? parseInt(form.pref_age_max) : null,
        photo_url: photoUrl,
        photo_visibility: form.photo_visibility,
      }

      let { error: saveErr } = await supabase.from('profiles').update(coreFields).eq('id', profileId)

      // If photo_visibility column doesn't exist yet (migration pending), retry without it
      if (saveErr?.message?.includes('photo_visibility') || saveErr?.code === '42703') {
        const { photo_visibility: _pv, ...withoutVisibility } = coreFields
        const retry = await supabase.from('profiles').update(withoutVisibility).eq('id', profileId)
        saveErr = retry.error
      }

      if (saveErr) throw saveErr
      setCurrentPhotoUrl(photoUrl)
      setSuccess('Profile saved!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function uploadExtraPhoto(file: File) {
    if (!profileId || additionalPhotos.length >= 4) return
    setUploadingExtra(true)
    try {
      const ext = file.name.split('.').pop()
      const position = additionalPhotos.length
      const path = `${profileId}/extra_${position}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path)
      const url = urlData.publicUrl
      await supabase.from('profile_photos').insert({ profile_id: profileId, url, position })
      setAdditionalPhotos(prev => [...prev, url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploadingExtra(false)
  }

  async function removeExtraPhoto(url: string) {
    if (!profileId) return
    await supabase.from('profile_photos').delete().eq('profile_id', profileId).eq('url', url)
    setAdditionalPhotos(prev => prev.filter(u => u !== url))
  }

  async function sendEmailOTP() {
    if (!userEmail) { setError('No email on file'); return }
    setOtpLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: userEmail,
      options: { shouldCreateUser: false }
    })
    if (error) setError('Could not send OTP: ' + error.message)
    else setOtpSent(true)
    setOtpLoading(false)
  }

  async function verifyEmailOTP() {
    if (!otpCode.trim()) return
    setOtpLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email: userEmail, token: otpCode.trim(), type: 'email'
    })
    if (error) {
      setError('Invalid code — check your email and try again')
    } else {
      await supabase.from('profiles').update({ phone_verified: true }).eq('id', profileId)
      setVerified(true)
      setOtpSent(false)
      setOtpCode('')
      setSuccess('Identity verified!')
    }
    setOtpLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}>
      <p className="text-stone-400 text-sm">Loading profile...</p>
    </div>
  )

  return (
    <div className="min-h-screen pb-20" style={{ background: '#FAFAF9' }}>
      <AppHeader />

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-stone-900 font-serif-display">Edit Profile</h1>
          <p className="text-sm text-stone-400 mt-0.5">Changes are saved to your profile immediately</p>
        </div>

        <BiodataUploader onParsed={data => {
          // Map any REGIONS district to native_region/native_state
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
            ...(data.birth_time ? { birth_time: String(data.birth_time) } : {}),
            ...(data.birth_place ? { birth_place: String(data.birth_place) } : {}),
            ...(data.height_cm ? { height_cm: String(data.height_cm) } : {}),
            ...(data.religion ? { religion: String(data.religion) } : {}),
            ...(data.caste ? { caste: String(data.caste) } : {}),
            ...(data.mother_tongue ? { mother_tongue: String(data.mother_tongue) } : {}),
            ...(data.education ? { education: String(data.education) } : {}),
            ...(data.profession ? { profession: String(data.profession) } : {}),
            ...(data.company ? { company: String(data.company) } : {}),
            ...(data.annual_income ? { annual_income: String(data.annual_income) } : {}),
            ...(data.visa_status ? { visa_status: String(data.visa_status) } : {}),
            ...(data.native_district ? { native_district: nd } : {}),
            ...(regionInfo ? { native_region: regionInfo.region, native_state: regionInfo.state } : {}),
            ...(data.current_city ? { current_city: String(data.current_city) } : {}),
            ...(data.current_state ? { current_state: String(data.current_state) } : {}),
            ...(data.father_name ? { father_name: String(data.father_name) } : {}),
            ...(data.father_occupation ? { father_occupation: String(data.father_occupation) } : {}),
            ...(data.mother_name ? { mother_name: String(data.mother_name) } : {}),
            ...(data.mother_occupation ? { mother_occupation: String(data.mother_occupation) } : {}),
            ...(data.siblings ? { siblings: String(data.siblings) } : {}),
            ...(data.siblings_married ? { siblings_married: String(data.siblings_married) } : {}),
            ...(data.star ? { star: String(data.star) } : {}),
            ...(data.rashi ? { rashi: String(data.rashi) } : {}),
            ...(data.gotra ? { gotra: String(data.gotra) } : {}),
            ...(data.manglik ? { manglik: String(data.manglik) } : {}),
            ...(data.diet ? { diet: String(data.diet) } : {}),
            ...(data.smoking ? { smoking: String(data.smoking) } : {}),
            ...(data.drinking ? { drinking: String(data.drinking) } : {}),
            ...(data.about ? { about: String(data.about).slice(0, 400) } : {}),
          }))
          setSuccess('Profile fields filled from your biodata — review below and save!')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }} />

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
            {success}
          </div>
        )}

        {/* Photo */}
        <div className="card p-5">
          <p className="font-semibold text-stone-800 mb-4 font-serif-display">Profile Photo</p>
          <div className="flex items-center gap-4 mb-4">
            {(photoPreview || currentPhotoUrl) ? (
              <img src={photoPreview || currentPhotoUrl} alt="Photo"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-stone-200" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-stone-400"
                style={{ background: '#F5F5F4' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}
            <div>
              <label className="btn-ghost text-sm cursor-pointer px-4 py-2">
                {photo ? 'Change photo' : currentPhotoUrl ? 'Replace photo' : 'Upload photo'}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)) }
                }} />
              </label>
              <p className="text-xs text-stone-400 mt-1">JPG or PNG, max 5MB</p>
            </div>
          </div>

          {/* Additional photos */}
          <div className="mb-5 pt-4 border-t" style={{ borderColor: '#F0EDE8' }}>
            <p className="form-label mb-2">More photos <span className="font-normal text-stone-400">({additionalPhotos.length}/4 added)</span></p>
            <p className="text-xs text-stone-400 mb-3">Add up to 4 more photos. Profiles with multiple photos get significantly more interest.</p>
            <div className="flex flex-wrap gap-2">
              {additionalPhotos.map((url, idx) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                  <img src={url} alt={`Photo ${idx + 2}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExtraPhoto(url)}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
              {additionalPhotos.length < 4 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-amber-600 transition-colors"
                  style={{ borderColor: '#D1C9BF' }}>
                  {uploadingExtra ? (
                    <span className="text-xs text-stone-400">Uploading...</span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span className="text-xs text-stone-400 mt-1">Add</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingExtra}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadExtraPhoto(f) }} />
                </label>
              )}
            </div>
          </div>

          <p className="form-label mb-2">Who can see your photo?</p>
          <div className="space-y-2">
            {VISIBILITY_OPTIONS.map(opt => (
              <label key={opt.value}
                className="flex items-start gap-3 px-3.5 py-3 rounded-lg border cursor-pointer transition-colors"
                style={{
                  borderColor: form.photo_visibility === opt.value ? '#B45309' : '#E8E0D6',
                  background: form.photo_visibility === opt.value ? '#FEF9EC' : 'white',
                }}>
                <input type="radio" name="photo_visibility" value={opt.value}
                  checked={form.photo_visibility === opt.value}
                  onChange={() => set('photo_visibility', opt.value)}
                  className="mt-0.5 accent-amber-700" />
                <div>
                  <p className="font-semibold text-stone-800 text-sm">{opt.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div className="card p-5">
          <p className="font-semibold text-stone-800 mb-4 font-serif-display">Personal Info</p>
          <div className="space-y-4">
            <div>
              <Label>Full name</Label>
              <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Time of birth <span className="text-stone-400 font-normal">(optional)</span></Label>
                <input className="input" placeholder="e.g. 6:45 PM" value={form.birth_time} onChange={e => set('birth_time', e.target.value)} />
              </div>
              <div>
                <Label>Place of birth <span className="text-stone-400 font-normal">(optional)</span></Label>
                <input className="input" placeholder="e.g. Ramagundam, Karimnagar" value={form.birth_place} onChange={e => set('birth_place', e.target.value)} />
              </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Height (cm)</Label>
                <input className="input" type="number" placeholder="e.g. 170" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
              </div>
              <div>
                <Label>Religion</Label>
                <input className="input" placeholder="e.g. Hindu" value={form.religion} onChange={e => set('religion', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Caste</Label>
              <input className="input" placeholder="Optional" value={form.caste} onChange={e => set('caste', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Marital status</Label>
                <select className="input" value={form.marital_status} onChange={e => set('marital_status', e.target.value)}>
                  <option value="never_married">Never married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </div>
              <div>
                <Label>Profile created by</Label>
                <select className="input" value={form.profile_created_by} onChange={e => set('profile_created_by', e.target.value)}>
                  <option value="self">Self</option>
                  <option value="parents">Parents</option>
                  <option value="sibling">Sibling</option>
                  <option value="relatives">Relatives</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-5">
          <p className="font-semibold text-stone-800 mb-4 font-serif-display">Location</p>
          <div className="space-y-4">
            <div>
              <Label>Native region</Label>
              <select className="input" value={form.native_region}
                onChange={e => { set('native_region', e.target.value); set('native_state', ''); set('native_district', '') }}>
                <option value="">Select region</option>
                {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Native state</Label>
                <select className="input" value={form.native_state}
                  onChange={e => { set('native_state', e.target.value); set('native_district', '') }}
                  disabled={!form.native_region}>
                  <option value="">Select state</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Native district</Label>
                <select className="input" value={form.native_district}
                  onChange={e => set('native_district', e.target.value)}
                  disabled={!form.native_state}>
                  <option value="">Select district</option>
                  {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
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
        </div>

        {/* Career & Education */}
        <div className="card p-5">
          <p className="font-semibold text-stone-800 mb-4 font-serif-display">Career & Education</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Profession</Label>
                <input className="input" placeholder="e.g. Software Engineer" value={form.profession} onChange={e => set('profession', e.target.value)} />
              </div>
              <div>
                <Label>Company <span className="text-stone-400 font-normal">(optional)</span></Label>
                <input className="input" placeholder="e.g. Amazon Web Services" value={form.company} onChange={e => set('company', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Education</Label>
              <input className="input" placeholder="e.g. B.Tech, MBA" value={form.education} onChange={e => set('education', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Annual income <span className="text-stone-400 font-normal">(optional)</span></Label>
                <select className="input" value={form.annual_income} onChange={e => set('annual_income', e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <optgroup label="India (LPA)">
                    <option value="Below 3 LPA">Below 3 LPA</option>
                    <option value="3–6 LPA">3–6 LPA</option>
                    <option value="6–10 LPA">6–10 LPA</option>
                    <option value="10–15 LPA">10–15 LPA</option>
                    <option value="15–25 LPA">15–25 LPA</option>
                    <option value="25–50 LPA">25–50 LPA</option>
                    <option value="50+ LPA">50+ LPA</option>
                  </optgroup>
                  <optgroup label="USA / Canada (USD)">
                    <option value="USD &lt;50k">USD &lt;50k</option>
                    <option value="USD 50–80k">USD 50–80k</option>
                    <option value="USD 80–120k">USD 80–120k</option>
                    <option value="USD 120–160k">USD 120–160k</option>
                    <option value="USD 160–200k">USD 160–200k</option>
                    <option value="USD 200k+">USD 200k+</option>
                  </optgroup>
                  <optgroup label="UK (GBP)">
                    <option value="GBP &lt;30k">GBP &lt;30k</option>
                    <option value="GBP 30–60k">GBP 30–60k</option>
                    <option value="GBP 60–100k">GBP 60–100k</option>
                    <option value="GBP 100k+">GBP 100k+</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <Label>Visa / immigration status <span className="text-stone-400 font-normal">(optional)</span></Label>
                <select className="input" value={form.visa_status} onChange={e => set('visa_status', e.target.value)}>
                  <option value="">Not applicable</option>
                  <option value="H1B">H1B</option>
                  <option value="H1B + i140 processing">H1B + i140 processing</option>
                  <option value="H1B + Green Card processing">H1B + Green Card processing</option>
                  <option value="H4 EAD">H4 EAD</option>
                  <option value="L1">L1</option>
                  <option value="F1 (Student)">F1 (Student)</option>
                  <option value="OPT / STEM OPT">OPT / STEM OPT</option>
                  <option value="Green Card (PR)">Green Card (PR)</option>
                  <option value="US Citizen">US Citizen</option>
                  <option value="UK Skilled Worker">UK Skilled Worker</option>
                  <option value="UK ILR / Settled">UK ILR / Settled</option>
                  <option value="UK Citizen">UK Citizen</option>
                  <option value="UAE Resident">UAE Resident</option>
                  <option value="Singapore EP / PR">Singapore EP / PR</option>
                  <option value="Australia PR">Australia PR</option>
                  <option value="Australia Citizen">Australia Citizen</option>
                  <option value="Canada PR">Canada PR</option>
                  <option value="Other">Other</option>
                </select>
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
              <div className="flex items-center justify-between mb-1">
                <Label>About yourself</Label>
                <button
                  type="button"
                  onClick={() => {
                    const name = form.full_name.split(' ')[0] || 'I'
                    const place = [form.native_district, form.native_state].filter(Boolean).join(', ')
                    const edu = form.education ? `, with a ${form.education} background` : ''
                    const fam = form.family_type === 'joint' ? 'joint' : form.family_type === 'nuclear' ? 'nuclear' : ''
                    const famStr = fam ? ` from a ${fam} family` : ''
                    const templates = [
                      `${name} is from ${place || 'a Telugu family'}${edu}. Currently working as a ${form.profession || 'professional'}${famStr}. Looking for a compatible life partner who values family and Telugu roots.`,
                      `From ${place || 'a Telugu household'}${edu}. ${form.profession ? `Working as a ${form.profession}` : 'A working professional'}${famStr}. Hoping to find a kind, family-oriented partner to share life with.`,
                      `${name} is a ${form.profession || 'professional'} from ${place || 'Andhra / Telangana'}${edu}. Down-to-earth${famStr}. Seeking a life partner with strong values and a good heart.`,
                    ]
                    set('about', templates[Math.floor(Math.random() * templates.length)].slice(0, 400))
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                  style={{background: '#FEF9EC', color: '#B45309'}}>
                  ✨ Generate bio
                </button>
              </div>
              <textarea className="input" rows={3}
                placeholder="A short note about yourself, what you're looking for..."
                value={form.about} onChange={e => set('about', e.target.value)} />
              <p className="text-xs text-stone-400 text-right mt-0.5">{form.about.length}/400</p>
            </div>
          </div>
        </div>

        {/* Family Background */}
        <div className="card p-5">
          <p className="font-semibold text-stone-800 mb-1 font-serif-display">Family Background</p>
          <p className="text-xs text-stone-400 mb-4">Shown only to mutual matches</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Father's name</Label>
                <input className="input" placeholder="e.g. Ravinder Reddy" value={form.father_name} onChange={e => set('father_name', e.target.value)} />
              </div>
              <div>
                <Label>Father's occupation</Label>
                <input className="input" placeholder="e.g. Business" value={form.father_occupation} onChange={e => set('father_occupation', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mother's name</Label>
                <input className="input" placeholder="e.g. Rathnamala" value={form.mother_name} onChange={e => set('mother_name', e.target.value)} />
              </div>
              <div>
                <Label>Mother's occupation</Label>
                <input className="input" placeholder="e.g. Home maker" value={form.mother_occupation} onChange={e => set('mother_occupation', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Siblings <span className="text-stone-400 font-normal">(optional)</span></Label>
              <input className="input" placeholder="e.g. Younger brother, studying in US" value={form.siblings} onChange={e => set('siblings', e.target.value)} />
            </div>
            <div>
              <Label>Siblings' marital status</Label>
              <select className="input" value={form.siblings_married} onChange={e => set('siblings_married', e.target.value)}>
                <option value="">Select</option>
                <option value="No siblings">No siblings</option>
                <option value="All married">All married</option>
                <option value="All unmarried">All unmarried</option>
                <option value="Some married, some unmarried">Some married, some unmarried</option>
              </select>
            </div>
          </div>
        </div>

        {/* Astrology — optional */}
        <div className="card p-5">
          <p className="font-semibold text-stone-800 mb-1 font-serif-display">Astrology</p>
          <p className="text-xs text-stone-400 mb-4">Optional — fill if your family values horoscope matching</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Star / Nakshatra</Label>
                <input className="input" placeholder="e.g. Rohini" value={form.star} onChange={e => set('star', e.target.value)} />
              </div>
              <div>
                <Label>Rashi / Moon sign</Label>
                <input className="input" placeholder="e.g. Vrishabha" value={form.rashi} onChange={e => set('rashi', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gotra</Label>
                <input className="input" placeholder="e.g. Kasyapa" value={form.gotra} onChange={e => set('gotra', e.target.value)} />
              </div>
              <div>
                <Label>Manglik</Label>
                <select className="input" value={form.manglik} onChange={e => set('manglik', e.target.value)}>
                  <option value="">Not specified</option>
                  <option value="Non-Manglik">Non-Manglik</option>
                  <option value="Manglik">Manglik</option>
                  <option value="Anshik Manglik">Anshik Manglik (Partial)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lifestyle — optional */}
        <div className="card p-5">
          <p className="font-semibold text-stone-800 mb-1 font-serif-display">Lifestyle</p>
          <p className="text-xs text-stone-400 mb-4">Optional — helps find compatible matches</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Diet</Label>
              <select className="input" value={form.diet} onChange={e => set('diet', e.target.value)}>
                <option value="">Not specified</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Veg</option>
                <option value="Eggetarian">Eggetarian</option>
              </select>
            </div>
            <div>
              <Label>Smoking</Label>
              <select className="input" value={form.smoking} onChange={e => set('smoking', e.target.value)}>
                <option value="">Not specified</option>
                <option value="Never">Never</option>
                <option value="Occasionally">Occasionally</option>
                <option value="Regularly">Regularly</option>
              </select>
            </div>
            <div>
              <Label>Drinking</Label>
              <select className="input" value={form.drinking} onChange={e => set('drinking', e.target.value)}>
                <option value="">Not specified</option>
                <option value="Never">Never</option>
                <option value="Occasionally">Occasionally</option>
                <option value="Regularly">Regularly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Partner Preferences */}
        <div className="card p-5">
          <p className="font-semibold text-stone-800 mb-1 font-serif-display">Partner Preferences</p>
          <p className="text-xs text-stone-400 mb-4">Helps us surface more compatible matches for you</p>
          <div className="space-y-4">
            <div>
              <Label>Preferred age range (years)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input className="input text-center w-20" type="number" placeholder="Min" min="18" max="60"
                  value={form.pref_age_min} onChange={e => set('pref_age_min', e.target.value)} />
                <span className="text-stone-400 text-sm">to</span>
                <input className="input text-center w-20" type="number" placeholder="Max" min="18" max="70"
                  value={form.pref_age_max} onChange={e => set('pref_age_max', e.target.value)} />
                <span className="text-stone-400 text-sm">yrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identity Verification */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-semibold text-stone-800 font-serif-display">Identity Verification</p>
              <p className="text-xs text-stone-400 mt-0.5">Verify your mobile number to get a Verified badge</p>
            </div>
            {verified && <span className="badge badge-approved shrink-0 mt-0.5">✓ Verified</span>}
          </div>

          {verified ? (
            <div className="flex items-center gap-2 text-sm text-stone-600 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Mobile number verified
            </div>
          ) : !phoneOtpSent ? (
            <div>
              {form.phone ? (
                <>
                  <p className="text-sm text-stone-600 mb-3">
                    We'll send a 6-digit code to{' '}
                    <span className="font-medium">{phoneCode} {form.phone}</span>
                  </p>
                  <button
                    onClick={async () => {
                      setPhoneOtpLoading(true)
                      setPhoneOtpError('')
                      setDevOtp('')
                      const fullPhone = `${phoneCode}${form.phone.trim()}`
                      const res = await fetch('/api/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: fullPhone }),
                      })
                      const data = await res.json()
                      setPhoneOtpLoading(false)
                      if (!res.ok) { setPhoneOtpError(data.error || 'Failed to send'); return }
                      setPhoneOtpToken(data.token)
                      setPhoneOtpSent(true)
                      if (data.dev_otp) setDevOtp(data.dev_otp)
                    }}
                    disabled={phoneOtpLoading}
                    className="btn-primary text-sm px-5 py-2.5">
                    {phoneOtpLoading ? 'Sending...' : 'Send OTP to mobile'}
                  </button>
                  {phoneOtpError && <p className="text-xs text-red-500 mt-2">{phoneOtpError}</p>}
                </>
              ) : (
                <p className="text-sm text-stone-500">Add your mobile number above first, then verify it here.</p>
              )}

              {/* Email OTP fallback */}
              {userEmail && (
                <div className="mt-5 pt-4 border-t" style={{borderColor: '#F0EBE3'}}>
                  <p className="text-xs text-stone-400 mb-2">Or verify via email instead</p>
                  {!otpSent ? (
                    <button onClick={sendEmailOTP} disabled={otpLoading}
                      className="text-xs font-semibold px-4 py-2 rounded-lg border"
                      style={{borderColor: '#E8E0D6', color: '#78716C'}}>
                      {otpLoading ? 'Sending...' : `Send code to ${userEmail}`}
                    </button>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <input className="input font-mono text-center text-base tracking-widest max-w-[130px]"
                        placeholder="000000" maxLength={6}
                        value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} />
                      <button onClick={verifyEmailOTP} disabled={otpLoading || otpCode.length < 6}
                        className="btn-primary text-sm px-4 py-2">
                        {otpLoading ? '...' : 'Confirm'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {devOtp && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{background: '#FEF9EC', color: '#92400E'}}>
                  Dev mode — OTP: <span className="font-bold font-mono">{devOtp}</span> (SMS not configured)
                </div>
              )}
              <p className="text-sm text-stone-600">
                Enter the 6-digit code sent to <span className="font-medium">{phoneCode} {form.phone}</span>
              </p>
              <div className="flex gap-2">
                <input className="input font-mono text-center text-lg tracking-widest max-w-[160px]"
                  placeholder="000000" maxLength={6}
                  value={phoneOtpCode} onChange={e => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))} />
                <button
                  disabled={phoneOtpLoading || phoneOtpCode.length < 6}
                  onClick={async () => {
                    setPhoneOtpLoading(true)
                    setPhoneOtpError('')
                    const fullPhone = `${phoneCode}${form.phone.trim()}`
                    const res = await fetch('/api/verify-otp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ otp: phoneOtpCode, token: phoneOtpToken, phone: fullPhone }),
                    })
                    const data = await res.json()
                    setPhoneOtpLoading(false)
                    if (!res.ok) { setPhoneOtpError(data.error || 'Verification failed'); return }
                    // Mark verified in DB
                    if (profileId) {
                      await supabase.from('profiles').update({ phone_verified: true }).eq('id', profileId)
                    }
                    setVerified(true)
                    setPhoneOtpSent(false)
                    setPhoneOtpCode('')
                  }}
                  className="btn-primary text-sm px-5 py-2.5">
                  {phoneOtpLoading ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
              {phoneOtpError && <p className="text-xs text-red-500">{phoneOtpError}</p>}
              <button onClick={() => { setPhoneOtpSent(false); setPhoneOtpCode(''); setPhoneOtpError('') }}
                className="text-xs text-stone-400 hover:text-stone-600">
                Resend code
              </button>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-3 text-sm">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <Link href={profileId ? `/profile/${profileId}` : '/browse'}
            className="btn-ghost py-3 text-sm px-5">
            View Profile
          </Link>
        </div>

        {/* Sign out */}
        <div className="pt-2 pb-4 flex justify-center">
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              localStorage.removeItem('my_profile_id')
              localStorage.removeItem('my_user_id')
              router.push('/')
            }}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors px-4 py-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
