'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '../../components/AppHeader'

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
  hidden_fields: string[] | null
  marital_status: string | null
  profile_created_by: string | null
  last_login_at: string | null
  pref_age_min: number | null
  pref_age_max: number | null
}

type FieldRequest = {
  id: string
  from_user: string
  to_user: string
  fields: string[]
  status: string
}

type ViewerEntry = {
  viewer_id: string
  full_name: string
  photo_url: string | null
  photo_visibility: string | null
  viewed_at: string
}

type IncomingRequest = {
  id: string
  from_user: string
  fields: string[]
  status: string
  full_name: string
  photo_url: string | null
  photo_visibility: string | null
}

function isSerious(p: Profile): boolean {
  return [p.education, p.about, p.height_cm, p.photo_url, p.caste].filter(Boolean).length >= 3
}

function getAge(dob: string): number | null {
  if (!dob) return null
  const age = Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  return age > 0 ? age : null
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function cmToFeet(cm: number): string {
  const ft = Math.floor(cm / 30.48)
  const inches = Math.round((cm % 30.48) / 2.54)
  return `${ft}'${inches}" (${cm} cm)`
}

function lastSeenLabel(ts: string | null): string | null {
  if (!ts) return null
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Active today'
  if (days <= 7) return `Active ${days}d ago`
  if (days <= 30) return `Active ${Math.floor(days / 7)}w ago`
  return null
}

function timeAgo(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days <= 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const AVATAR_COLORS = ['#B45309', '#0369A1', '#047857', '#6D28D9', '#BE185D']
function avatarBg(name: string) { return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length] }

const REQUIRED_FIELD_LABELS = new Set(['Height', 'Religion', 'Profession', 'Education', 'Family type', 'Mother tongue', 'Date of Birth'])
const RECOMMENDED_FIELD_LABELS = new Set(['Caste', 'Star / Nakshatra', 'Rashi', 'Diet', 'Father', 'Mother', 'About'])

const HIDEABLE: Record<string, string> = {
  photo: 'Profile photo',
  phone: 'Phone number',
  gotra: 'Gotra',
  native_location: 'Native district & region',
  current_city: 'Current city',
}

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
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [extraPhotos, setExtraPhotos] = useState<string[]>([])
  const [photoIdx, setPhotoIdx] = useState(0)
  // P2
  const [fieldRequest, setFieldRequest] = useState<FieldRequest | null>(null)
  const [sendingFieldReq, setSendingFieldReq] = useState(false)
  const [viewers, setViewers] = useState<ViewerEntry[]>([])
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([])
  const [approvingReq, setApprovingReq] = useState<string | null>(null)

  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    setIsLoggedIn(!!myId)
    setMyProfileId(myId)
    loadProfile(myId)
    if (myId) {
      checkInterestStatus(myId)
      checkRelation(myId)
      if (myId !== (id as string)) {
        logView(myId)
        loadFieldRequest(myId)
      } else {
        loadViewers()
        loadIncomingRequests()
      }
    }
  }, [id])

  async function loadProfile(myId: string | null) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    setProfile(data)
    const { data: photos } = await supabase
      .from('profile_photos').select('url').eq('profile_id', id).order('position')
    setExtraPhotos((photos || []).map(p => p.url))
    setLoading(false)
  }

  async function logView(myId: string) {
    await supabase.from('profile_views').insert({ viewer_id: myId, viewed_id: id as string })
      .then(() => {})
  }

  async function loadFieldRequest(myId: string) {
    const { data } = await supabase.from('field_requests')
      .select('*').eq('from_user', myId).eq('to_user', id as string).maybeSingle()
    if (data) setFieldRequest(data)
  }

  async function loadViewers() {
    const { data: views } = await supabase.from('profile_views')
      .select('viewer_id, viewed_at')
      .eq('viewed_id', id as string)
      .order('viewed_at', { ascending: false })
      .limit(30)
    if (!views?.length) return
    const uniqueIds = [...new Set(views.map(v => v.viewer_id))]
    const { data: profiles } = await supabase.from('profiles')
      .select('id, full_name, photo_url, photo_visibility')
      .in('id', uniqueIds)
    const merged: ViewerEntry[] = uniqueIds.map(vid => {
      const p = profiles?.find(p => p.id === vid)
      const v = views.find(v => v.viewer_id === vid)
      return { viewer_id: vid, full_name: p?.full_name || 'Someone', photo_url: p?.photo_url || null, photo_visibility: p?.photo_visibility || null, viewed_at: v?.viewed_at || '' }
    })
    setViewers(merged)
  }

  async function loadIncomingRequests() {
    const { data: reqs } = await supabase.from('field_requests')
      .select('*').eq('to_user', id as string).eq('status', 'pending')
    if (!reqs?.length) return
    const fromIds = reqs.map(r => r.from_user)
    const { data: profiles } = await supabase.from('profiles')
      .select('id, full_name, photo_url, photo_visibility')
      .in('id', fromIds)
    const merged: IncomingRequest[] = reqs.map(r => {
      const p = profiles?.find(p => p.id === r.from_user)
      return { ...r, full_name: p?.full_name || 'Someone', photo_url: p?.photo_url || null, photo_visibility: p?.photo_visibility || null }
    })
    setIncomingRequests(merged)
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

  async function requestFields(fields: string[]) {
    if (!myProfileId || !profile) return
    setSendingFieldReq(true)
    if (fieldRequest) {
      const merged = [...new Set([...fieldRequest.fields, ...fields])]
      await supabase.from('field_requests').update({ fields: merged, status: 'pending' }).eq('id', fieldRequest.id)
      setFieldRequest({ ...fieldRequest, fields: merged, status: 'pending' })
    } else {
      const { data } = await supabase.from('field_requests')
        .insert({ from_user: myProfileId, to_user: profile.id, fields })
        .select().maybeSingle()
      setFieldRequest(data)
    }
    // Notify owner
    const { data: me } = await supabase.from('profiles').select('full_name').eq('id', myProfileId).maybeSingle()
    await supabase.from('notifications').insert({
      user_id: profile.user_id,
      type: 'field_request',
      message: `${me?.full_name || 'Someone'} requested to see your ${fields.map(f => HIDEABLE[f] || f).join(', ')}`,
      from_profile_id: myProfileId,
      read: false,
    }).then(() => {})
    setSendingFieldReq(false)
  }

  async function respondToRequest(reqId: string, fromUser: string, approve: boolean) {
    setApprovingReq(reqId)
    await supabase.from('field_requests').update({ status: approve ? 'approved' : 'declined' }).eq('id', reqId)
    setIncomingRequests(prev => prev.filter(r => r.id !== reqId))
    if (approve && profile) {
      // Notify requester
      const { data: me } = await supabase.from('profiles').select('full_name, user_id').eq('id', myProfileId!).maybeSingle()
      const fromProfile = incomingRequests.find(r => r.id === reqId)
      if (fromProfile) {
        const { data: fromUser2 } = await supabase.from('profiles').select('user_id').eq('id', fromUser).maybeSingle()
        if (fromUser2) {
          await supabase.from('notifications').insert({
            user_id: fromUser2.user_id,
            type: 'field_request_approved',
            message: `${me?.full_name || 'Someone'} approved your request to see their private info`,
            from_profile_id: myProfileId,
            read: false,
          }).then(() => {})
        }
      }
    }
    setApprovingReq(null)
  }

  function fieldIsHidden(key: string): boolean {
    if (!profile) return false
    return (profile.hidden_fields || []).includes(key)
  }

  function fieldIsRevealed(key: string): boolean {
    if (!fieldRequest) return false
    return fieldRequest.status === 'approved' && fieldRequest.fields.includes(key)
  }

  function fieldIsRequested(key: string): boolean {
    if (!fieldRequest) return false
    return fieldRequest.fields.includes(key)
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
  const isOwnProfile = myProfileId === profile.id

  // Photo visibility: use hidden_fields first, fall back to old photo_visibility
  const photoHidden = fieldIsHidden('photo')
  const photoRevealed = fieldIsRevealed('photo')
  const showPhoto = !!profile.photo_url && (!photoHidden || isOwnProfile || photoRevealed ||
    (!fieldIsHidden('photo') && (() => {
      const v = profile.photo_visibility || 'after_match'
      if (v === 'hidden') return false
      if (v === 'public') return true
      if (v === 'after_match') return viewerRelation === 'matched'
      if (v === 'after_interest') return viewerRelation === 'matched' || viewerRelation === 'interested' || viewerRelation === 'received'
      return false
    })()))

  // Helper: render a potentially-hidden bio row value
  function renderFieldValue(fieldKey: string | undefined, value: string | null, label?: string) {
    const hidden = fieldKey ? fieldIsHidden(fieldKey) : false
    const revealed = fieldKey ? fieldIsRevealed(fieldKey) : false
    const showVal = !hidden || isOwnProfile || revealed

    if (showVal) {
      if (value) return <p className="font-semibold text-stone-700 text-sm">{value}</p>
      if (isOwnProfile) {
        const isRequired = label ? REQUIRED_FIELD_LABELS.has(label) : false
        const isRecommended = label ? RECOMMENDED_FIELD_LABELS.has(label) : false
        return (
          <Link href="/profile/edit" className="inline-flex items-center gap-1.5">
            {isRequired && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#FEF2F2', color: '#DC2626' }}>Required</span>
            )}
            {isRecommended && !isRequired && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#FFFBEB', color: '#B45309' }}>Fill in</span>
            )}
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#B45309' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </span>
          </Link>
        )
      }
      return <p className="text-sm text-stone-300">—</p>
    }

    // Hidden and not revealed
    const isPending = fieldKey ? fieldIsRequested(fieldKey) : false
    return (
      <div className="space-y-1">
        <p className="font-semibold text-stone-300 text-sm select-none" style={{ filter: 'blur(5px)', userSelect: 'none' }}>
          ██████████
        </p>
        {isLoggedIn && !isOwnProfile && (
          <button
            onClick={() => fieldKey && requestFields([fieldKey])}
            disabled={isPending || sendingFieldReq}
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all"
            style={isPending
              ? { background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }
              : { background: 'white', color: '#B45309', borderColor: '#E8C99A' }}>
            {isPending ? '✓ Requested' : '👁 Request'}
          </button>
        )}
      </div>
    )
  }

  const bioSections: { heading: string; rows: { label: string; value: string | null; fieldKey?: string; wide?: boolean }[] }[] = [
    {
      heading: 'Personal',
      rows: [
        { label: 'Date of Birth', value: profile.date_of_birth ? new Date(profile.date_of_birth + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
        { label: 'Time of Birth', value: profile.birth_time || null },
        { label: 'Place of Birth', value: profile.birth_place || null },
        { label: 'Height', value: profile.height_cm ? cmToFeet(profile.height_cm) : null },
        { label: 'Marital status', value: profile.marital_status ? cap(profile.marital_status.replace(/_/g, ' ')) : 'Never married' },
        { label: 'Profile by', value: profile.profile_created_by ? cap(profile.profile_created_by.replace(/_/g, ' ')) : null },
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
        { label: 'Father', value: [profile.father_name, profile.father_occupation].filter(Boolean).join(' · ') || null, wide: true },
        { label: 'Mother', value: [profile.mother_name, profile.mother_occupation].filter(Boolean).join(' · ') || null, wide: true },
        { label: 'Siblings', value: profile.siblings || null, wide: true },
        { label: 'Siblings status', value: profile.siblings_married || null },
      ],
    },
    {
      heading: 'Astrology',
      rows: [
        { label: 'Star / Nakshatra', value: profile.star || null },
        { label: 'Rashi', value: profile.rashi || null },
        { label: 'Gotra', value: profile.gotra || null, fieldKey: 'gotra' },
        { label: 'Manglik', value: profile.manglik || null },
      ],
    },
  ]

  return (
    <div className="min-h-screen pb-28" style={{ background: '#FAFAF9' }}>

      <AppHeader />

      {!isOwnProfile && (
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">

        {/* Hero card */}
        <div className="card overflow-hidden">
          {(() => {
            return (
              <div className="relative py-8 flex flex-col items-center"
                style={{ background: 'linear-gradient(160deg, #FEF9EC 0%, #FFF7F0 100%)' }}>
                {showPhoto ? (() => {
                  const allPhotos = [profile.photo_url, ...extraPhotos].filter(Boolean) as string[]
                  return (
                    <div className="mb-3 flex flex-col items-center gap-2">
                      <button onClick={() => setPhotoExpanded(true)} className="focus:outline-none group relative">
                        <img src={allPhotos[photoIdx]} alt={profile.full_name}
                          className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md transition-transform group-hover:scale-105 cursor-zoom-in" />
                        <div className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                      </button>
                      {allPhotos.length > 1 && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPhotoIdx(i => (i - 1 + allPhotos.length) % allPhotos.length)}
                            className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#F5F0EB' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                          </button>
                          {allPhotos.map((_, i) => (
                            <button key={i} onClick={() => setPhotoIdx(i)}
                              className="w-1.5 h-1.5 rounded-full transition-all"
                              style={{ background: i === photoIdx ? '#B45309' : '#D6CFC6' }} />
                          ))}
                          <button onClick={() => setPhotoIdx(i => (i + 1) % allPhotos.length)}
                            className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#F5F0EB' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                          <span className="text-xs text-stone-400">{photoIdx + 1}/{allPhotos.length}</span>
                        </div>
                      )}
                    </div>
                  )
                })() : (
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-sm"
                      style={{ background: avatarBg(profile.full_name) }}>
                      {initials(profile.full_name)}
                    </div>
                    {profile.photo_url && photoHidden && !photoRevealed && isLoggedIn && !isOwnProfile && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <button
                          onClick={() => requestFields(['photo'])}
                          disabled={fieldIsRequested('photo') || sendingFieldReq}
                          className="text-xs font-semibold px-3 py-1 rounded-full border transition-all shadow-sm"
                          style={fieldIsRequested('photo')
                            ? { background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }
                            : { background: 'white', color: '#B45309', borderColor: '#E8C99A' }}>
                          {fieldIsRequested('photo') ? '✓ Photo requested' : '📷 Request photo'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isLoggedIn && myProfileId !== profile.id && (
                  <button
                    onClick={openNoteModal}
                    disabled={interestSent || sending}
                    className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-full"
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
                  {lastSeenLabel(profile.last_login_at) && (
                    <span className="ml-2 text-xs text-stone-400">· {lastSeenLabel(profile.last_login_at)}</span>
                  )}
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
                {fieldIsHidden('native_location') && !isOwnProfile && !fieldIsRevealed('native_location')
                  ? profile.native_state
                  : `${profile.native_district}, ${profile.native_state}`}
                {profile.native_region && !fieldIsHidden('native_location') && ` (${profile.native_region})`}
              </span>
              {isSerious(profile) && (
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                  ★ Serious Seeker
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile completeness — own profile only */}
        {isOwnProfile && (() => {
          const fields = [
            profile.photo_url, profile.about, profile.height_cm, profile.caste,
            profile.education, profile.profession, profile.family_type,
            profile.father_name, profile.mother_name, profile.star, profile.diet,
          ]
          const filled = fields.filter(Boolean).length
          const pct = Math.round((filled / fields.length) * 100)
          const missing = [
            !profile.photo_url && 'Profile photo',
            !profile.about && 'About me',
            !profile.height_cm && 'Height',
            !profile.caste && 'Caste',
            !profile.education && 'Education',
            !profile.family_type && 'Family type',
            !profile.father_name && 'Father\'s name',
            !profile.star && 'Star / Nakshatra',
            !profile.diet && 'Diet preference',
          ].filter(Boolean).slice(0, 3)
          return (
            <div className="card px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-stone-800">Profile completeness</p>
                <span className="text-sm font-bold" style={{ color: pct >= 80 ? '#059669' : '#B45309' }}>{pct}%</span>
              </div>
              <div className="w-full rounded-full h-2 mb-3" style={{ background: '#F0EDE8' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? '#059669' : '#B45309' }} />
              </div>
              {missing.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-400">Missing: {missing.join(', ')}</p>
                  <Link href="/profile/edit" className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: '#FEF9EC', color: '#B45309' }}>
                    Complete profile →
                  </Link>
                </div>
              )}
              {pct === 100 && <p className="text-xs text-stone-400">Great job — your profile is complete!</p>}
            </div>
          )
        })()}

        {/* Who viewed you — own profile */}
        {isOwnProfile && viewers.length > 0 && (
          <div className="card px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-stone-800">Who viewed your profile</p>
              <span className="text-xs text-stone-400">{viewers.length} recent</span>
            </div>
            <div className="space-y-3">
              {viewers.slice(0, 8).map(v => (
                <Link key={v.viewer_id} href={`/profile/${v.viewer_id}`}
                  className="flex items-center gap-3 group">
                  {v.photo_url && v.photo_visibility === 'public' ? (
                    <img src={v.photo_url} alt={v.full_name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-stone-100 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: avatarBg(v.full_name) }}>
                      {initials(v.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 group-hover:underline truncate">{v.full_name}</p>
                    <p className="text-xs text-stone-400">{timeAgo(v.viewed_at)}</p>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D6CFC6" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Incoming field requests — own profile */}
        {isOwnProfile && incomingRequests.length > 0 && (
          <div className="card px-5 py-4">
            <p className="text-sm font-semibold text-stone-800 mb-3">
              Info requests
              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#DC2626' }}>
                {incomingRequests.length}
              </span>
            </p>
            <div className="space-y-3">
              {incomingRequests.map(req => (
                <div key={req.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FFFBF5', border: '1px solid #F0EDE8' }}>
                  {req.photo_url && req.photo_visibility === 'public' ? (
                    <img src={req.photo_url} alt={req.full_name}
                      className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: avatarBg(req.full_name) }}>
                      {initials(req.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800">{req.full_name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Wants to see: {req.fields.map(f => HIDEABLE[f] || f).join(', ')}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => respondToRequest(req.id, req.from_user, true)}
                        disabled={approvingReq === req.id}
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: '#059669', color: 'white' }}>
                        Approve
                      </button>
                      <button
                        onClick={() => respondToRequest(req.id, req.from_user, false)}
                        disabled={approvingReq === req.id}
                        className="text-xs font-semibold px-3 py-1 rounded-full border"
                        style={{ borderColor: '#E8E0D6', color: '#78716C' }}>
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick facts */}
        <div className="card">
          {[
            {
              label: 'Current city',
              fieldKey: 'current_city',
              value: fieldIsHidden('current_city') && !isOwnProfile && !fieldIsRevealed('current_city')
                ? null
                : `${profile.current_city}${profile.current_state ? ', ' + profile.current_state : ''}`,
              hidden: fieldIsHidden('current_city') && !isOwnProfile && !fieldIsRevealed('current_city'),
            },
            { label: 'Profession', fieldKey: undefined, value: profile.profession, sub: profile.education, hidden: false },
          ].map((r, i) => (
            <div key={r.label}
              className={`px-6 py-4 flex items-start gap-4 ${i > 0 ? 'border-t' : ''}`}
              style={{ borderColor: '#F0EBE3' }}>
              <div className="w-28 section-label shrink-0 pt-0.5">{r.label}</div>
              <div className="flex-1">
                {r.hidden ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-stone-300 text-sm select-none" style={{ filter: 'blur(5px)', userSelect: 'none' }}>██████████</p>
                    {isLoggedIn && !isOwnProfile && (
                      <button
                        onClick={() => requestFields(['current_city'])}
                        disabled={fieldIsRequested('current_city') || sendingFieldReq}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all"
                        style={fieldIsRequested('current_city')
                          ? { background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }
                          : { background: 'white', color: '#B45309', borderColor: '#E8C99A' }}>
                        {fieldIsRequested('current_city') ? '✓ Requested' : '👁 Request'}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-stone-800 text-sm">{r.value || '—'}</div>
                    {r.sub && <div className="text-xs text-stone-400 mt-0.5">{r.sub}</div>}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        {(profile.about || isOwnProfile) && (
          <div className="card px-6 py-5">
            <p className="section-label mb-2.5">About</p>
            {profile.about ? (
              <p className="text-stone-600 leading-relaxed text-sm">"{profile.about}"</p>
            ) : (
              <Link href="/profile/edit" className="text-sm font-medium flex items-center gap-1" style={{ color: '#B45309' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add a bio — tell people about yourself
              </Link>
            )}
          </div>
        )}

        {/* Full biodata — always visible, hidden fields blurred */}
        <div className="card px-6 py-5">
          <p className="section-label mb-4">Full biodata</p>
          <div className="space-y-0">
            {bioSections.map((section, si) => (
              <div key={section.heading} className={si > 0 ? 'pt-4 mt-4 border-t' : ''} style={si > 0 ? { borderColor: '#F0EBE3' } : {}}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B45309' }}>{section.heading}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {section.rows.map(f => (
                    <div key={f.label} className={f.wide ? 'col-span-2' : ''}>
                      <p className="text-xs text-stone-400 mb-0.5 flex items-center gap-1">
                        {f.label}
                        {isOwnProfile && !f.value && REQUIRED_FIELD_LABELS.has(f.label) && (
                          <span className="font-bold" style={{ color: '#DC2626' }}>*</span>
                        )}
                      </p>
                      {renderFieldValue(f.fieldKey, f.value, f.label)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact — phone hidden by default */}
        {(() => {
          const phoneHidden = fieldIsHidden('phone') && !isOwnProfile && !fieldIsRevealed('phone')
          const showContact = isOwnProfile || viewerRelation === 'matched'
          if (!showContact && !profile.phone && !profile.email) return null
          return (
            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B45309' }}>Contact</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {profile.phone && (
                  <div>
                    <p className="text-xs text-stone-400 mb-0.5">Phone</p>
                    {phoneHidden ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-stone-300 text-sm select-none" style={{ filter: 'blur(5px)', userSelect: 'none' }}>██████████</p>
                        {isLoggedIn && !isOwnProfile && (
                          <button
                            onClick={() => requestFields(['phone'])}
                            disabled={fieldIsRequested('phone') || sendingFieldReq}
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all"
                            style={fieldIsRequested('phone')
                              ? { background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }
                              : { background: 'white', color: '#B45309', borderColor: '#E8C99A' }}>
                            {fieldIsRequested('phone') ? '✓ Requested' : '👁 Request'}
                          </button>
                        )}
                      </div>
                    ) : showContact ? (
                      <p className="font-semibold text-stone-700 text-sm">{profile.phone}</p>
                    ) : (
                      <p className="font-semibold text-stone-300 text-sm">—</p>
                    )}
                  </div>
                )}
                {profile.email && showContact && (
                  <div className="col-span-2">
                    <p className="text-xs text-stone-400 mb-0.5">Email</p>
                    <p className="font-semibold text-stone-700 text-sm">{profile.email}</p>
                  </div>
                )}
              </div>
              {!showContact && !isOwnProfile && (
                <p className="text-xs text-stone-400 mt-2">Contact details unlock after mutual match</p>
              )}
            </div>
          )
        })()}
      </div>

      {/* Report link */}
      {isLoggedIn && myProfileId !== profile.id && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="text-xs text-stone-300 hover:text-red-400 transition-colors px-4 py-2">
            Report / Block profile
          </button>
        </div>
      )}

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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setShowReportModal(false)}>
          <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 card p-6">
            <h3 className="font-bold text-stone-900 font-serif-display mb-4">Report profile</h3>
            {reportSent ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✓</p>
                <p className="font-semibold text-stone-700">Report submitted</p>
                <p className="text-xs text-stone-400 mt-1">Our team will review this within 24 hours.</p>
                <button onClick={() => setShowReportModal(false)} className="btn-ghost mt-4 px-6 py-2 text-sm">Close</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-stone-400 mb-4">Select a reason</p>
                <div className="space-y-2 mb-5">
                  {['Fake or scam profile', 'Inappropriate content or photo', 'Harassment or abusive behaviour', 'Married / misleading information', 'Other'].map(r => (
                    <label key={r} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
                      style={{ borderColor: reportReason === r ? '#B45309' : '#E8E0D6', background: reportReason === r ? '#FEF9EC' : 'white' }}>
                      <input type="radio" name="report_reason" value={r} checked={reportReason === r}
                        onChange={() => setReportReason(r)} className="accent-amber-700" />
                      <span className="text-sm text-stone-700">{r}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => setShowReportModal(false)} className="flex-1 btn-ghost py-2.5 text-sm">Cancel</button>
                  <button
                    disabled={!reportReason}
                    onClick={async () => {
                      const myId = localStorage.getItem('my_profile_id')
                      if (!myId || !reportReason) return
                      await supabase.from('reports').insert({ reporter: myId, reported: id as string, reason: reportReason }).then(() => {})
                      setReportSent(true)
                    }}
                    className="flex-1 btn-primary py-2.5 text-sm"
                    style={!reportReason ? { opacity: 0.5 } : {}}>
                    Submit report
                  </button>
                </div>
              </>
            )}
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
          {(() => {
            const allPhotos = [profile.photo_url, ...extraPhotos].filter(Boolean) as string[]
            return (
              <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
                <img src={allPhotos[photoIdx]} alt={profile.full_name}
                  className="max-w-[90vw] max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
                {allPhotos.length > 1 && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPhotoIdx(i => (i - 1 + allPhotos.length) % allPhotos.length)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    {allPhotos.map((_, i) => (
                      <button key={i} onClick={() => setPhotoIdx(i)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{ background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.4)' }} />
                    ))}
                    <button onClick={() => setPhotoIdx(i => (i + 1) % allPhotos.length)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3.5"
        style={{ borderColor: '#E8E0D6', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}>
        <div className="max-w-3xl mx-auto">
          {myProfileId === profile.id ? (
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
