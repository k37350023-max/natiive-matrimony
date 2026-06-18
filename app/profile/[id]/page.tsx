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

const AVATAR_COLORS = ['#B45309', '#0369A1', '#047857', '#6D28D9', '#BE185D']
function avatarBg(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }

export default function ProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [interestSent, setInterestSent] = useState(false)
  const [shortlisted, setShortlisted] = useState(false)
  const [sending, setSending] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    setIsLoggedIn(!!myId)
    loadProfile()
    if (myId) checkInterestStatus(myId)
  }, [id])

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
    setLoading(false)
  }

  async function checkInterestStatus(myId: string) {
    const { data } = await supabase.from('interests')
      .select('id').eq('from_user', myId).eq('to_user', id as string).maybeSingle()
    if (data) setInterestSent(true)
  }

  async function expressInterest() {
    const myId = localStorage.getItem('my_profile_id')
    if (!myId) { router.push('/register'); return }
    if (myId === id) return
    setSending(true)
    const { error } = await supabase.from('interests').insert({ from_user: myId, to_user: id, status: 'pending' })
    if (!error) setInterestSent(true)
    else setInterestSent(true)
    setSending(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}>
      <div className="text-stone-400 text-sm">Loading...</div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}>
      <div className="text-center">
        <p className="font-semibold text-stone-700">Profile not found</p>
        <Link href="/browse" className="text-sm underline mt-2 block" style={{ color: '#B45309' }}>Back to browse</Link>
      </div>
    </div>
  )

  const bioRows = [
    { label: 'Height', value: profile.height_cm ? `${profile.height_cm} cm` : null },
    { label: 'Religion', value: profile.religion || null },
    { label: 'Caste', value: profile.caste || null },
    { label: 'Mother tongue', value: profile.mother_tongue || null },
    { label: 'Family type', value: profile.family_type ? profile.family_type.charAt(0).toUpperCase() + profile.family_type.slice(1) : null },
    { label: 'Phone', value: profile.phone || null },
  ].filter(r => r.value)

  return (
    <div className="min-h-screen pb-28" style={{ background: '#FAFAF9' }}>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E8E0D6' }}>
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/browse" className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Browse
          </Link>
          <Link href="/" className="text-base font-bold text-stone-900 font-serif-display">
            Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
          </Link>
          <Link href="/matches" className="text-sm font-medium text-stone-500 hover:text-stone-700">Matches</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">

        {/* Hero card */}
        <div className="card overflow-hidden">
          <div className="relative py-10 flex flex-col items-center"
            style={{ background: 'linear-gradient(160deg, #FEF9EC 0%, #FFF7F0 100%)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 ring-4 ring-white shadow-sm"
              style={{ background: avatarBg(profile.full_name) }}>
              {initials(profile.full_name)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
              style={{ background: 'white', borderColor: '#E8E0D6', color: '#78716C' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Photo visible after mutual match
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 font-serif-display tracking-tight">{profile.full_name}</h1>
                <p className="text-stone-500 mt-0.5 text-sm">{getAge(profile.date_of_birth)} years · {profile.gender === 'male' ? 'Groom' : 'Bride'}</p>
              </div>
              {profile.verified && (
                <span className="badge badge-verified shrink-0 mt-1">✓ Verified</span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge badge-native text-sm px-3 py-1.5">
                {profile.native_district}, {profile.native_state}
              </span>
              {profile.native_region && (
                <span className="text-xs px-3 py-1.5 rounded-full border font-medium"
                  style={{ borderColor: '#E8E0D6', color: '#78716C' }}>
                  {profile.native_region}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick facts */}
        <div className="card">
          {[
            { label: 'Current city', value: `${profile.current_city}${profile.current_state ? ', ' + profile.current_state : ''}` },
            { label: 'Profession', value: profile.profession, sub: profile.education },
          ].map((r, i) => (
            <div key={r.label}
              className={`px-6 py-4 flex items-start gap-4 ${i > 0 ? 'border-t' : ''}`}
              style={{ borderColor: '#F0EBE3' }}>
              <div className="w-28 section-label shrink-0 pt-0.5">{r.label}</div>
              <div>
                <div className="font-semibold text-stone-800 text-sm">{r.value}</div>
                {r.sub && <div className="text-xs text-stone-400 mt-0.5">{r.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        {profile.about && (
          <div className="card px-6 py-5">
            <p className="section-label mb-2.5">About</p>
            <p className="text-stone-600 leading-relaxed text-sm">"{profile.about}"</p>
          </div>
        )}

        {/* Locked biodata */}
        <div className="card overflow-hidden relative">
          <div className="px-6 py-5" style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
            <p className="section-label mb-4">Full biodata</p>
            <div className="grid grid-cols-2 gap-4">
              {bioRows.map(f => (
                <div key={f.label}>
                  <p className="text-xs text-stone-400 mb-0.5">{f.label}</p>
                  <p className="font-semibold text-stone-700 text-sm">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: 'rgba(250,250,249,0.82)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ background: '#FEF9EC' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="font-semibold text-stone-800 text-sm">Biodata is private</p>
            <p className="text-xs text-stone-400 mt-1">Unlocks after a mutual match</p>
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3.5"
        style={{ borderColor: '#E8E0D6', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}>
        <div className="max-w-3xl mx-auto">
          {isLoggedIn ? (
            <>
              <div className="flex gap-2.5">
                <button
                  onClick={expressInterest}
                  disabled={interestSent || sending}
                  className="flex-1 btn-primary py-3 text-sm"
                >
                  {interestSent ? '✓ Interest Sent' : sending ? 'Sending...' : 'Express Interest'}
                </button>
                <button
                  onClick={() => setShortlisted(s => !s)}
                  className="px-4 py-3 rounded-lg font-semibold text-sm border transition-all"
                  style={shortlisted
                    ? { background: '#FEF9EC', color: '#92400E', borderColor: '#E8C99A' }
                    : { background: 'white', color: '#78716C', borderColor: '#E8E0D6' }}>
                  {shortlisted ? '★ Saved' : '☆ Save'}
                </button>
              </div>
              {!interestSent && (
                <p className="text-center text-xs text-stone-400 mt-2">Both must accept before contact is shared</p>
              )}
            </>
          ) : (
            <>
              <div className="flex gap-2.5">
                <Link href="/register" className="flex-1 btn-primary py-3 text-sm text-center">
                  Register to Express Interest
                </Link>
                <Link href="/login"
                  className="px-4 py-3 rounded-lg font-semibold text-sm border text-center"
                  style={{ background: 'white', color: '#78716C', borderColor: '#E8E0D6' }}>
                  Login
                </Link>
              </div>
              <p className="text-center text-xs text-stone-400 mt-2">Free until September 2026 · No credit card needed</p>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
