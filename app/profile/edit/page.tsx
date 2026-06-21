'use client'
import React, { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
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

const HIDEABLE_FIELDS: { key: string; label: string; desc: string }[] = [
  { key: 'photo', label: 'Profile photo', desc: 'Others see initials instead; they can request to see your photo' },
  { key: 'phone', label: 'Phone number', desc: 'Hidden from everyone; they can request it' },
  { key: 'gotra', label: 'Gotra', desc: 'Blurred on your profile; requestable' },
  { key: 'native_location', label: 'Native district & region', desc: 'Only your state is shown; district is hidden' },
  { key: 'current_city', label: 'Current city', desc: 'Blurred on your profile; requestable' },
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

const Label = ({ children, required, recommended }: { children: React.ReactNode; required?: boolean; recommended?: boolean }) => (
  <label className="form-label">
    {children}
    {required && <span className="ml-0.5 font-bold" style={{ color: '#DC2626' }}>*</span>}
    {recommended && !required && <span className="ml-1 font-normal text-xs" style={{ color: '#0B132B' }}>recommended</span>}
  </label>
)

const REQUIRED_FIELDS = ['full_name', 'gender', 'date_of_birth', 'native_region', 'native_state', 'native_district', 'height_cm', 'religion', 'profession', 'education', 'family_type', 'mother_tongue'] as const

function CollapsibleCard({ title, subtitle, badge, defaultOpen = false, children }: {
  title: string; subtitle?: string; badge?: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card p-5">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left">
        <div>
          <p className="font-semibold text-gray-800 font-serif-display">
            {title}
            {badge && <span className="ml-2 align-middle text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: '#EAF8FE', color: '#0B132B' }}>{badge}</span>}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B132B" strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}

function EditProfilePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNewProfile = searchParams.get('new') === '1'
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
  // Per-field privacy
  const [hiddenFields, setHiddenFields] = useState<string[]>([])

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
    brothers: '', sisters: '', brothers_married: '', sisters_married: '',
    star: '', rashi: '', gotra: '', manglik: '',
    diet: '', smoking: '', drinking: '',
    pref_age_min: '21', pref_age_max: '35',
  })

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  type Sibling = { name: string; relation: string; married: boolean }
  const [siblings, setSiblings] = React.useState<Sibling[]>([])

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
      brothers: '', sisters: '', brothers_married: '', sisters_married: '',
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
    })
    try {
      const s = JSON.parse(data.siblings || '[]')
      if (Array.isArray(s)) setSiblings(s)
    } catch { /* ignore */ }
    setHiddenFields(data.hidden_fields || [])
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
    const missing = [
      !form.full_name.trim() && 'Full name',
      !form.gender && 'Gender',
      !form.date_of_birth && 'Date of birth',
      !form.native_region && 'Native region',
      !form.native_state && 'Native state',
      !form.native_district && 'Native district',
      !form.height_cm && 'Height',
      !form.religion.trim() && 'Religion',
      !form.profession.trim() && 'Profession',
      !form.education.trim() && 'Education',
      !form.family_type && 'Family type',
    ].filter(Boolean)
    if (missing.length) {
      setError(`Please fill required fields: ${missing.join(', ')}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
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
        siblings: siblings.length ? JSON.stringify(siblings) : null,
        siblings_married: (() => {
          if (!siblings.length) return 'No siblings'
          const married = siblings.filter(s => s.married).length
          if (married === siblings.length) return 'All married'
          if (married === 0) return 'All unmarried'
          return 'Some married, some unmarried'
        })(),
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
        hidden_fields: hiddenFields,
        photo_visibility: hiddenFields.includes('photo') ? 'hidden' : 'public',
      }

      // Secured: updates only the signed-in user's own profile (id from session cookie).
      const res = await fetch('/api/profiles/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: coreFields }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed')
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
      <p className="text-gray-400 text-sm">Loading profile...</p>
    </div>
  )

  return (
    <div className="min-h-screen pb-20" style={{ background: '#F8FAFC' }}>
      <AppHeader />

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {isNewProfile && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#EAF8FE', border: '1px solid #BDE9F7', color: '#0B132B' }}>
            Welcome! Fill in the fields below — required fields marked <span className="font-bold" style={{ color: '#9B1C1C' }}>*</span>. The more you fill, the more interest you'll get.
          </div>
        )}
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900 font-serif-display">Edit Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">Changes are saved to your profile immediately</p>
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
            ...(() => {
              if (!data.siblings) return {}
              try {
                const s = typeof data.siblings === 'string' ? JSON.parse(data.siblings) : data.siblings
                if (Array.isArray(s)) { setSiblings(s); return {} }
              } catch { return {} }
              return {}
            })(),
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
          <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#EAF8FE', color: '#0B132B', border: '1px solid #BDE9F7' }}>
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
          <p className="font-semibold text-gray-800 mb-4 font-serif-display">Profile Photo</p>
          <div className="flex items-center gap-4 mb-4">
            {(photoPreview || currentPhotoUrl) ? (
              <img loading="lazy" src={photoPreview || currentPhotoUrl} alt="Photo"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-gray-400"
                style={{ background: '#EEF2F7' }}>
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
              <p className="text-xs text-gray-400 mt-1">JPG or PNG, max 5MB</p>
            </div>
          </div>

          {/* Additional photos */}
          <div className="mb-5 pt-4 border-t" style={{ borderColor: '#E8EDF3' }}>
            <p className="form-label mb-2">More photos <span className="font-normal text-gray-400">({additionalPhotos.length}/4 added)</span></p>
            <p className="text-xs text-gray-400 mb-3">Add up to 4 more photos. Profiles with multiple photos get significantly more interest.</p>
            <div className="flex flex-wrap gap-2">
              {additionalPhotos.map((url, idx) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                  <img loading="lazy" src={url} alt={`Photo ${idx + 2}`} className="w-full h-full object-cover" />
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
                    <span className="text-xs text-gray-400">Uploading...</span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span className="text-xs text-gray-400 mt-1">Add</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingExtra}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadExtraPhoto(f) }} />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: '#E8EDF3' }}>
            <p className="form-label mb-1">Privacy — what do you want to hide?</p>
            <p className="text-xs text-gray-400 mb-3">Hidden fields show as blurred on your profile. Visitors can request to see them — you approve or decline.</p>
            <div className="space-y-2">
              {HIDEABLE_FIELDS.map(f => {
                const checked = hiddenFields.includes(f.key)
                return (
                  <label key={f.key}
                    className="flex items-start gap-3 px-3.5 py-3 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      borderColor: checked ? '#0B132B' : '#E8EDF3',
                      background: checked ? '#EAF8FE' : 'white',
                    }}>
                    <input type="checkbox" checked={checked}
                      onChange={() => setHiddenFields(prev =>
                        prev.includes(f.key) ? prev.filter(k => k !== f.key) : [...prev, f.key]
                      )}
                      className="mt-0.5 accent-amber-700" />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{f.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card p-5">
          <p className="font-semibold text-gray-800 mb-4 font-serif-display">Personal Info</p>
          <div className="space-y-4">
            <div>
              <Label required>Full name</Label>
              <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Gender</Label>
                <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option value="male">Male (Groom)</option>
                  <option value="female">Female (Bride)</option>
                </select>
              </div>
              <div>
                <Label required>Date of birth</Label>
                <input className="input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Time of birth <span className="text-gray-400 font-normal">(optional)</span></Label>
                <input className="input" placeholder="e.g. 6:45 PM" value={form.birth_time} onChange={e => set('birth_time', e.target.value)} />
              </div>
              <div>
                <Label>Place of birth <span className="text-gray-400 font-normal">(optional)</span></Label>
                <input className="input" placeholder="e.g. Ramagundam, Karimnagar" value={form.birth_place} onChange={e => set('birth_place', e.target.value)} />
              </div>
            </div>
            <div>
              <Label required>Mobile number</Label>
              <div className="flex rounded-lg overflow-hidden" style={{border: '1.5px solid var(--border)'}}>
                <select
                  value={phoneCode}
                  onChange={e => setPhoneCode(e.target.value)}
                  className="bg-gray-50 text-sm font-medium text-gray-700 px-2 py-2.5 border-r outline-none shrink-0"
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
                <Label required>Height (cm)</Label>
                <input className="input" type="number" placeholder="e.g. 170" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
              </div>
              <div>
                <Label required>Religion</Label>
                <input className="input" placeholder="e.g. Hindu" value={form.religion} onChange={e => set('religion', e.target.value)} />
              </div>
            </div>
            <div>
              <Label recommended>Caste</Label>
              <input className="input" placeholder="e.g. Kamma, Reddy, Brahmin" value={form.caste} onChange={e => set('caste', e.target.value)} />
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
          <p className="font-semibold text-gray-800 mb-4 font-serif-display">Location</p>
          <div className="space-y-4">
            <div>
              <Label required>Native region</Label>
              <select className="input" value={form.native_region}
                onChange={e => { set('native_region', e.target.value); set('native_state', ''); set('native_district', '') }}>
                <option value="">Select region</option>
                {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Native state</Label>
                <select className="input" value={form.native_state}
                  onChange={e => { set('native_state', e.target.value); set('native_district', '') }}
                  disabled={!form.native_region}>
                  <option value="">Select state</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label required>Native district</Label>
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
                <Label required>Current city</Label>
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
          <p className="font-semibold text-gray-800 mb-4 font-serif-display">Career & Education</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Profession</Label>
                <input className="input" placeholder="e.g. Software Engineer" value={form.profession} onChange={e => set('profession', e.target.value)} />
              </div>
              <div>
                <Label>Company <span className="text-gray-400 font-normal">(optional)</span></Label>
                <input className="input" placeholder="e.g. Amazon Web Services" value={form.company} onChange={e => set('company', e.target.value)} />
              </div>
            </div>
            <div>
              <Label required>Education</Label>
              <input className="input" placeholder="e.g. B.Tech, MBA" value={form.education} onChange={e => set('education', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Annual income <span className="text-gray-400 font-normal">(optional)</span></Label>
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
                <Label>Visa / immigration status <span className="text-gray-400 font-normal">(optional)</span></Label>
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
                <Label required>Mother tongue</Label>
                <select className="input" value={form.mother_tongue} onChange={e => set('mother_tongue', e.target.value)}>
                  <option value="Telugu">Telugu</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label required>Family type</Label>
                <select className="input" value={form.family_type} onChange={e => set('family_type', e.target.value)}>
                  <option value="">Select</option>
                  <option value="nuclear">Nuclear</option>
                  <option value="joint">Joint</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label recommended>About yourself</Label>
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
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  style={{background: '#EAF8FE', color: '#0B132B'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1z"/></svg>
                  Generate bio
                </button>
              </div>
              <textarea className="input" rows={3}
                placeholder="A short note about yourself, what you're looking for..."
                value={form.about} onChange={e => set('about', e.target.value)} />
              <p className="text-xs text-gray-400 text-right mt-0.5">{form.about.length}/400</p>
            </div>
          </div>
        </div>

        {/* Family Background */}
        <CollapsibleCard title="Family Background" subtitle="Shown only to mutual matches">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label recommended>Father's name</Label>
                <input className="input" placeholder="e.g. Ravinder Reddy" value={form.father_name} onChange={e => set('father_name', e.target.value)} />
              </div>
              <div>
                <Label recommended>Father's occupation</Label>
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
              <Label>Siblings <span className="text-gray-400 font-normal">(optional)</span></Label>
              <div className="space-y-2 mt-1">
                {siblings.map((sib, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="input flex-1"
                      placeholder="Name"
                      value={sib.name}
                      onChange={e => setSiblings(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                    />
                    <select
                      className="input w-32"
                      value={sib.relation}
                      onChange={e => setSiblings(prev => prev.map((s, j) => j === i ? { ...s, relation: e.target.value } : s))}>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                    </select>
                    <select
                      className="input w-32"
                      value={sib.married ? 'married' : 'unmarried'}
                      onChange={e => setSiblings(prev => prev.map((s, j) => j === i ? { ...s, married: e.target.value === 'married' } : s))}>
                      <option value="unmarried">Unmarried</option>
                      <option value="married">Married</option>
                    </select>
                    <button type="button" onClick={() => setSiblings(prev => prev.filter((_, j) => j !== i))}
                      className="text-gray-400 hover:text-red-500 shrink-0 text-lg leading-none">×</button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setSiblings(prev => [...prev, { name: '', relation: 'Brother', married: false }])}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: '#E8EDF3', color: '#0B132B' }}>
                  + Add sibling
                </button>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* Astrology — optional */}
        <CollapsibleCard title="Astrology" badge="Optional" subtitle="Fill if your family values horoscope matching">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label recommended>Star / Nakshatra</Label>
                <input className="input" placeholder="e.g. Rohini" value={form.star} onChange={e => set('star', e.target.value)} />
              </div>
              <div>
                <Label recommended>Rashi / Moon sign</Label>
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
        </CollapsibleCard>

        {/* Lifestyle — optional */}
        <CollapsibleCard title="Lifestyle" badge="Optional" subtitle="Helps find compatible matches">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label recommended>Diet</Label>
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
        </CollapsibleCard>

        {/* Partner Preferences */}
        <CollapsibleCard title="Partner Preferences" badge="Optional" subtitle="Helps us surface more compatible matches for you">
          <div className="space-y-4">
            <div>
              <Label>Preferred age range (years)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input className="input text-center w-20" type="number" placeholder="Min" min="18" max="60"
                  value={form.pref_age_min} onChange={e => set('pref_age_min', e.target.value)} />
                <span className="text-gray-400 text-sm">to</span>
                <input className="input text-center w-20" type="number" placeholder="Max" min="18" max="70"
                  value={form.pref_age_max} onChange={e => set('pref_age_max', e.target.value)} />
                <span className="text-gray-400 text-sm">yrs</span>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* Identity Verification */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-semibold text-gray-800 font-serif-display">Identity Verification</p>
              <p className="text-xs text-gray-400 mt-0.5">Verify your mobile number to get a Verified badge</p>
            </div>
            {verified && <span className="badge badge-approved shrink-0 mt-0.5">✓ Verified</span>}
          </div>

          {verified ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06D6A0" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Mobile number verified
            </div>
          ) : !phoneOtpSent ? (
            <div>
              {form.phone ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
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
                <p className="text-sm text-gray-500">Add your mobile number above first, then verify it here.</p>
              )}

              {/* Email OTP fallback */}
              {userEmail && (
                <div className="mt-5 pt-4 border-t" style={{borderColor: '#F3F4F6'}}>
                  <p className="text-xs text-gray-400 mb-2">Or verify via email instead</p>
                  {!otpSent ? (
                    <button onClick={sendEmailOTP} disabled={otpLoading}
                      className="text-xs font-semibold px-4 py-2 rounded-lg border"
                      style={{borderColor: '#E8EDF3', color: '#5B6478'}}>
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
                <div className="text-xs px-3 py-2 rounded-lg" style={{background: '#EAF8FE', color: '#0B132B'}}>
                  Dev mode — OTP: <span className="font-bold font-mono">{devOtp}</span> (SMS not configured)
                </div>
              )}
              <p className="text-sm text-gray-600">
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
                className="text-xs text-gray-400 hover:text-gray-600">
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

      </div>
    </div>
  )
}

export default function EditProfilePage() {
  return (
    <Suspense>
      <EditProfilePageInner />
    </Suspense>
  )
}
