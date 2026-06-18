'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = {
  id: string
  user_id: string
  full_name: string
  gender: string
  date_of_birth: string
  birth_time: string
  birth_place: string
  profession: string
  company: string
  annual_income: string
  visa_status: string
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
  father_name: string
  father_occupation: string
  mother_name: string
  mother_occupation: string
  siblings: string
  siblings_married: string
  star: string
  rashi: string
  gotra: string
  manglik: string
  diet: string
  smoking: string
  drinking: string
  about: string
  verified: boolean
  phone_verified: boolean
  phone: string
  email: string
  photo_url: string
  photo_visibility: string | null
}

function isSerious(p: Profile): boolean {
  return [p.education, p.about, p.height_cm, p.photo_url, p.caste].filter(Boolean).length >= 3
}

function canShowPhoto(profile: Profile, relation: string): boolean {
  if (!profile.photo_url) return false
  const v = profile.photo_visibility || 'after_match'
  if (v === 'hidden') return false
  if (v === 'public') return true
  if (v === 'after_match') return relation === 'matched'
  if (v === 'after_interest') return relation === 'matched' || relation === 'interested' || relation === 'received'
  return false
}

function getAge(dob: string): number | null {
  if (!dob) return null
  const age = Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  return age > 0 ? age : null
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
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [viewerRelation, setViewerRelation] = useState<'matched' | 'interested' | 'received' | 'none'>('none')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [photoExpanded, setPhotoExpanded] = useState(false)

  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    setIsLoggedIn(!!myId)
    setMyProfileId(myId)
    loadProfile()
    if (myId) {
      checkInterestStatus(myId)
      checkRelation(myId)
    }
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

  async function checkRelation(myId: string) {
    const { data: match } = await supabase.from('matches').select('id')
      .or(`and(user1.eq.${myId},user2.eq.${id}),and(user1.eq.${id},user2.eq.${myId})`)
      .maybeSingle()
    if (match) { setViewerRelation('matched'); return }
    const { data: sent } = await supabase.from('interests').select('id')
      .eq('from_user', myId).eq('to_user', id as string).maybeSingle()
    if (sent) { setViewerRelation('interested'); return }
    const { data: received } = await supabase.from('interests').select('id')
      .eq('from_user', id as string).eq('to_user', myId).maybeSingle()
    if (received) setViewerRelation('received')
  }

  function openNoteModal() {
    const myId = localStorage.getItem('my_profile_id')
    if (!myId) { router.push('/register'); return }
    if (myId === id) return
    setShowNoteModal(true)
  }

  async function expressInterest(note?: string) {
    const myId = localStorage.getItem('my_profile_id')
    if (!myId) { router.push('/register'); return }
    if (myId === id) return
    setSending(true)
    const payload: Record<string, unknown> = { from_user: myId, to_user: id as string, status: 'pending' }
    if (note?.trim()) payload.note = note.trim()
    const { error } = await supabase.from('interests').insert(payload)
    if (error && note) {
      await supabase.from('interests').insert({ from_user: myId, to_user: id as string, status: 'pending' })
    }

    // Notification + email
    if (profile) {
      const { data: me } = await supabase.from('profiles').select('full_name').eq('id', myId).single()
      const msg = note?.trim()
        ? `${me?.full_name || 'Someone'} sent you an interest: "${note.trim()}"`
        : `${me?.full_name || 'Someone'} sent you an interest request`
      supabase.from('notifications').insert({
        user_id: profile.user_id, type: 'interest_received',
        message: msg, from_profile_id: myId, read: false
      })
      if (profile.email) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: profile.email,
            subject: 'New Interest — NatiiveMatrimony',
            html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#1C1917">You have a new interest!</h2>
              <p style="color:#57534E"><strong>${me?.full_name || 'Someone'}</strong> sent you an interest on NatiiveMatrimony.</p>
              ${note?.trim() ? `<blockquote style="border-left:3px solid #B45309;margin:16px 0;padding:8px 16px;color:#57534E;font-style:italic">"${note.trim()}"</blockquote>` : ''}
              <a href="https://nativematrimony.com/interests" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#B45309;color:white;border-radius:8px;text-decoration:none;font-weight:600">View &amp; Respond</a>
            </div>`
          })
        }).catch(() => {})
      }
    }

    setInterestSent(true)
    setSending(false)
    setShowNoteModal(false)
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

  const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

  const bioSections: { heading: string; rows: { label: string; value: string | null }[] }[] = [
    {
      heading: 'Personal',
      rows: [
        { label: 'Date of Birth', value: profile.date_of_birth ? new Date(profile.date_of_birth + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
        { label: 'Time of Birth', value: profile.birth_time || null },
        { label: 'Place of Birth', value: profile.birth_place || null },
        { label: 'Height', value: profile.height_cm ? `${profile.height_cm} cm` : null },
        { label: 'Religion', value: profile.religion || null },
        { label: 'Caste', value: profile.caste || null },
        { label: 'Mother tongue', value: profile.mother_tongue || null },
        { label: 'Diet', value: profile.diet || null },
        { label: 'Smoking', value: profile.smoking || null },
        { label: 'Drinking', value: profile.drinking || null },
      ],
    },
    {
      heading: 'Professional',
      rows: [
        { label: 'Profession', value: profile.profession || null },
        { label: 'Company', value: profile.company || null },
        { label: 'Education', value: profile.education || null },
        { label: 'Annual income', value: profile.annual_income || null },
        { label: 'Visa / status', value: profile.visa_status || null },
      ],
    },
    {
      heading: 'Family',
      rows: [
        { label: 'Family type', value: profile.family_type ? cap(profile.family_type) : null },
        { label: 'Father', value: [profile.father_name, profile.father_occupation].filter(Boolean).join(' · ') || null },
        { label: 'Mother', value: [profile.mother_name, profile.mother_occupation].filter(Boolean).join(' · ') || null },
        { label: 'Siblings', value: profile.siblings || null },
        { label: 'Siblings status', value: profile.siblings_married || null },
      ],
    },
    {
      heading: 'Astrology',
      rows: [
        { label: 'Star / Nakshatra', value: profile.star || null },
        { label: 'Rashi', value: profile.rashi || null },
        { label: 'Gotra', value: profile.gotra || null },
        { label: 'Manglik', value: profile.manglik || null },
      ],
    },
  ].map(s => ({ ...s, rows: s.rows.filter(r => r.value) })).filter(s => s.rows.length > 0)

  const contactRows = [
    { label: 'Phone', value: profile.phone || null },
    { label: 'Email', value: profile.email || null },
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
          {myProfileId === profile?.id
            ? <Link href="/profile/edit" className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: '#B45309', background: '#FEF9EC' }}>Edit</Link>
            : <Link href="/matches" className="text-sm font-medium text-stone-500 hover:text-stone-700">Matches</Link>
          }
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">

        {/* Hero card */}
        <div className="card overflow-hidden">
          {(() => {
            const showPhoto = canShowPhoto(profile, viewerRelation)
            return (
              <div className="relative py-8 flex flex-col items-center"
                style={{ background: 'linear-gradient(160deg, #FEF9EC 0%, #FFF7F0 100%)' }}>
                {showPhoto ? (
                  <button onClick={() => setPhotoExpanded(true)} className="mb-3 focus:outline-none group relative">
                    <img src={profile.photo_url} alt={profile.full_name}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md transition-transform group-hover:scale-105 cursor-zoom-in" />
                    <div className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                  </button>
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 ring-4 ring-white shadow-sm"
                    style={{ background: avatarBg(profile.full_name) }}>
                    {initials(profile.full_name)}
                  </div>
                )}
                {!showPhoto && profile.photo_url && (
                  <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border mb-2"
                    style={{ background: 'white', borderColor: '#E8E0D6', color: '#78716C' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    {profile.photo_visibility === 'after_interest' ? 'Send interest to see photo' : 'Photo visible after mutual match'}
                  </div>
                )}
                {isLoggedIn && myProfileId !== profile.id && (
                  <button
                    onClick={openNoteModal}
                    disabled={interestSent || sending}
                    className="mt-1 text-xs font-semibold px-4 py-1.5 rounded-full"
                    style={interestSent
                      ? { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }
                      : { background: '#B45309', color: 'white' }}>
                    {interestSent ? '✓ Interest Sent' : '+ Send Interest'}
                  </button>
                )}
              </div>
            )
          })()}

          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 font-serif-display tracking-tight">{profile.full_name}</h1>
                <p className="text-stone-500 mt-0.5 text-sm whitespace-nowrap">
                  {getAge(profile.date_of_birth) != null ? `${getAge(profile.date_of_birth)} yrs · ` : ''}{profile.gender === 'male' ? 'Groom' : 'Bride'}
                </p>
              </div>
              {(profile.verified || profile.phone_verified) ? (
                <div className="relative group shrink-0 mt-1">
                  <span className="badge badge-verified cursor-default">✓ Verified</span>
                  <div className="absolute bottom-full right-0 mb-2 w-52 px-3 py-2 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 leading-relaxed"
                    style={{ background: '#1C1917' }}>
                    {profile.verified ? 'Verified via phone linkage & manual community review' : 'Email verified'}
                    <div className="absolute top-full right-3 border-4 border-transparent" style={{ borderTopColor: '#1C1917' }} />
                  </div>
                </div>
              ) : myProfileId === profile.id ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0 mt-1"
                  style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
                  Verification pending · up to 24h
                </span>
              ) : null}
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
              {isSerious(profile) && (
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                  ★ Serious Seeker
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

        {/* Biodata — unlocked for own profile or mutual match */}
        {(() => {
          const unlocked = myProfileId === profile.id || viewerRelation === 'matched'
          const biodataContent = (
            <div className="space-y-0">
              {bioSections.map((section, si) => (
                <div key={section.heading} className={si > 0 ? 'pt-4 mt-4 border-t' : ''} style={si > 0 ? { borderColor: '#F0EBE3' } : {}}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B45309' }}>{section.heading}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {section.rows.map(f => (
                      <div key={f.label} className={f.label === 'Siblings' || f.label === 'Email' ? 'col-span-2' : ''}>
                        <p className="text-xs text-stone-400 mb-0.5">{f.label}</p>
                        <p className="font-semibold text-stone-700 text-sm">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
          return unlocked ? (
            <>
              <div className="card px-6 py-5">
                <p className="section-label mb-4">Full biodata</p>
                {biodataContent}
              </div>
              {contactRows.length > 0 && (
                <div className="card px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B45309' }}>Contact</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {contactRows.map(f => (
                      <div key={f.label} className={f.label === 'Email' ? 'col-span-2' : ''}>
                        <p className="text-xs text-stone-400 mb-0.5">{f.label}</p>
                        <p className="font-semibold text-stone-700 text-sm">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card overflow-hidden relative">
              <div className="px-6 py-5" style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
                <p className="section-label mb-4">Full biodata</p>
                {biodataContent}
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
          )
        })()}
      </div>

      {/* Personalized Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setShowNoteModal(false)}>
          <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 font-serif-display">Break the ice</h3>
                <p className="text-xs text-stone-400 mt-0.5">Add a personal note — optional but encouraged</p>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="text-stone-300 hover:text-stone-500 ml-3 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <textarea
              className="input w-full resize-none text-sm"
              rows={3}
              placeholder={`Hi, I noticed we share the same native place...`}
              maxLength={200}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <p className="text-xs text-stone-400 text-right mt-1">{noteText.length}/200</p>
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => expressInterest()}
                disabled={sending}
                className="flex-1 btn-ghost py-2.5 text-sm">
                Skip &amp; Send
              </button>
              <button
                onClick={() => expressInterest(noteText)}
                disabled={sending}
                className="flex-1 btn-primary py-2.5 text-sm">
                {sending ? 'Sending...' : 'Send with Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      {photoExpanded && profile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setPhotoExpanded(false)}>
          <button
            onClick={() => setPhotoExpanded(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img
            src={profile.photo_url}
            alt={profile.full_name}
            onClick={e => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3.5"
        style={{ borderColor: '#E8E0D6', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}>
        <div className="max-w-3xl mx-auto">
          {myProfileId === profile.id ? (
            /* Own profile — show edit + matches links */
            <div>
              <div className="flex gap-2.5">
                <Link href="/profile/edit" className="flex-1 btn-primary py-3 text-sm text-center">
                  Edit Profile
                </Link>
                <Link href="/matches"
                  className="flex-1 py-3 rounded-lg font-semibold text-sm border text-center"
                  style={{ background: 'white', color: '#78716C', borderColor: '#E8E0D6' }}>
                  My Matches
                </Link>
              </div>
              <div className="flex justify-center mt-2.5">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    localStorage.removeItem('my_profile_id')
                    localStorage.removeItem('my_user_id')
                    router.push('/')
                  }}
                  className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors px-3 py-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          ) : isLoggedIn ? (
            <>
              <div className="flex gap-2.5">
                <button
                  onClick={openNoteModal}
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
