'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = {
  id: string
  full_name: string
  gender: string
  date_of_birth: string
  profession: string
  education: string
  native_district: string
  native_state: string
  native_region: string
  current_city: string
  current_state: string
  height_cm: number
  religion: string
  caste: string
  mother_tongue: string
  family_type: string
  about: string
  verified: boolean
  phone: string
  email: string
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function ProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [interestSent, setInterestSent] = useState(false)
  const [shortlisted, setShortlisted] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => { loadProfile() }, [id])

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
    setLoading(false)
  }

  async function expressInterest() {
    setSending(true)
    const myId = localStorage.getItem('my_profile_id')
    if (!myId) {
      setSending(false)
      alert('Please register your profile first to express interest.')
      router.push('/register')
      return
    }
    if (myId === id) {
      setSending(false)
      alert('This is your own profile.')
      return
    }
    const { error } = await supabase.from('interests').insert({ from_user: myId, to_user: id, status: 'pending' })
    if (error) alert(error.message)
    else setInterestSent(true)
    setSending(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background: '#FFF7ED'}}>
      <div className="text-stone-400 text-sm">Loading profile...</div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{background: '#FFF7ED'}}>
      <div className="text-center">
        <p className="font-semibold text-stone-700">Profile not found</p>
        <Link href="/browse" className="text-sm text-orange-700 underline mt-2 block">Back to browse</Link>
      </div>
    </div>
  )

  const rows = [
    { label: 'Native Place', value: `${profile.native_district}, ${profile.native_state}`, sub: profile.native_region },
    { label: 'Current City', value: `${profile.current_city}, ${profile.current_state}` },
    { label: 'Profession', value: profile.profession, sub: profile.education },
  ]

  const biodataFields = [
    { label: 'Height', value: profile.height_cm ? `${profile.height_cm} cm` : '—' },
    { label: 'Religion', value: profile.religion || '—' },
    { label: 'Caste', value: profile.caste || '—' },
    { label: 'Mother Tongue', value: profile.mother_tongue || '—' },
    { label: 'Family Type', value: profile.family_type ? profile.family_type.charAt(0).toUpperCase() + profile.family_type.slice(1) : '—' },
    { label: 'Phone', value: profile.phone || '—' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{background: '#FFF7ED'}}>
      {/* Header */}
      <header style={{background: 'white', borderBottom: '1px solid #E7E5E4'}}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/browse" className="text-sm text-stone-500 hover:text-orange-700 flex items-center gap-1">
            ← Browse
          </Link>
          <Link href="/" className="text-base font-bold text-stone-900">
            Natiive<span className="text-orange-700">Matrimony</span>
          </Link>
          <Link href="/matches" className="text-sm font-medium text-stone-600 hover:text-orange-700">My Matches</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {/* Profile hero card */}
        <div className="card overflow-hidden">
          <div className="h-40 flex items-center justify-center relative" style={{background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)'}}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{background: '#C2410C', filter: 'blur(10px)'}}>
              {initials(profile.full_name)}
            </div>
            <div className="absolute bottom-3 text-center">
              <span className="text-xs text-stone-500 bg-white bg-opacity-90 px-3 py-1 rounded-full">Photo unlocks after mutual match</span>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-stone-900">{profile.full_name}</h1>
              {profile.verified && <span className="badge badge-verified">✓ Verified</span>}
            </div>
            <p className="text-stone-500">{getAge(profile.date_of_birth)} years · {profile.gender === 'male' ? 'Groom' : 'Bride'}</p>
          </div>
        </div>

        {/* 3 info rows */}
        <div className="card divide-y divide-stone-100">
          {rows.map(r => (
            <div key={r.label} className="px-6 py-4 flex items-center gap-4">
              <div className="w-28 section-label shrink-0">{r.label}</div>
              <div>
                <div className="font-medium text-stone-800">{r.value}</div>
                {r.sub && <div className="text-xs text-stone-400 mt-0.5">{r.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        {profile.about && (
          <div className="card px-6 py-5">
            <p className="section-label mb-2">About</p>
            <p className="text-stone-700 leading-relaxed">{profile.about}</p>
          </div>
        )}

        {/* Locked biodata */}
        <div className="card overflow-hidden relative">
          <div className="px-6 py-5" style={{filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none'}}>
            <p className="section-label mb-3">Full Biodata</p>
            <div className="grid grid-cols-2 gap-3">
              {biodataFields.map(f => (
                <div key={f.label}>
                  <p className="text-xs text-stone-400">{f.label}</p>
                  <p className="font-medium text-stone-700 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{background: 'rgba(255,255,255,0.7)'}}>
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p className="font-semibold text-stone-700">Biodata is private</p>
            <p className="text-sm text-stone-400 mt-0.5">Unlocks after mutual interest</p>
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={expressInterest}
            disabled={interestSent || sending}
            className="flex-1 btn-primary py-3"
          >
            {interestSent ? '✓ Interest Sent' : sending ? 'Sending...' : 'Express Interest'}
          </button>
          <button
            onClick={() => setShortlisted(s => !s)}
            className="px-5 py-3 rounded-lg font-semibold text-sm transition-colors"
            style={{
              background: shortlisted ? '#FEF9C3' : '#F5F5F4',
              color: shortlisted ? '#854D0E' : '#78716C',
              border: shortlisted ? '1.5px solid #FDE047' : '1.5px solid #E7E5E4'
            }}
          >
            {shortlisted ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
