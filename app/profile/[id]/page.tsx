'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  member_number: number | null
  premium_expires_at: string | null
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
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 2) return 'Active just now'
  if (mins < 60) return `Active ${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs === 1) return 'Active 1 hour ago'
  if (hrs < 5) return 'Active a few hours ago'
  if (hrs < 24) return `Active ${hrs} hours ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Active yesterday'
  if (days <= 6) return `Active ${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'Active a week ago'
  if (weeks < 4) return `Active ${weeks} weeks ago`
  const months = Math.floor(days / 30)
  if (months === 1) return 'Active a month ago'
  return `Active ${months} months ago`
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

const AVATAR_COLORS = ['#9B1C1C', '#0369A1', '#047857', '#6D28D9', '#BE185D']
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
  const searchParams = useSearchParams()
  const previewMode = searchParams.get('preview') === '1'
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [interestSent, setInterestSent] = useState(false)
  const [shortlisted, setShortlisted] = useState(false)
  const [sending, setSending] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [viewerRelation, setViewerRelation] = useState<'matched' | 'interested' | 'received' | 'none'>('none')
  const [chatMatchId, setChatMatchId] = useState<string | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [photoExpanded, setPhotoExpanded] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [extraPhotos, setExtraPhotos] = useState<string[]>([])
  const [photoIdx, setPhotoIdx] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [verifiedOpen, setVerifiedOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  // P2
  const [fieldRequest, setFieldRequest] = useState<FieldRequest | null>(null)
  const [sendingFieldReq, setSendingFieldReq] = useState(false)
  const [viewers, setViewers] = useState<ViewerEntry[]>([])
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([])
  const [approvingReq, setApprovingReq] = useState<string | null>(null)
  // Similar profiles & compatibility
  const [similarProfiles, setSimilarProfiles] = useState<{id:string;full_name:string;profession:string;native_district:string;date_of_birth:string;photo_url:string|null;photo_visibility:string|null}[]>([])
  const [myAge, setMyAge] = useState<number|null>(null)
  const [compatScore, setCompatScore] = useState<{match:number;total:number}|null>(null)

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
        // Fetch my age for compat check
        supabase.from('profiles').select('date_of_birth').eq('id', myId).maybeSingle()
          .then(({data}) => { if (data?.date_of_birth) setMyAge(getAge(data.date_of_birth)) })
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

    // Similar profiles: same district or profession, different person
    if (data) {
      const { data: similar } = await supabase.from('profiles')
        .select('id,full_name,profession,native_district,date_of_birth,photo_url,photo_visibility')
        .eq('status', 'approved')
        .eq('gender', data.gender)
        .or(`native_district.eq.${data.native_district},profession.ilike.%${(data.profession||'').split(' ')[0]}%`)
        .neq('id', id as string)
        .limit(6)
      setSimilarProfiles((similar || []).filter(p => p.id !== myId).slice(0, 4))
    }

    // Compatibility score: how many of viewer's prefs does this profile match
    if (myId && data) {
      const { data: me } = await supabase.from('profiles')
        .select('date_of_birth,pref_age_min,pref_age_max,religion,caste,mother_tongue,native_district')
        .eq('id', myId).maybeSingle()
      if (me) {
        let match = 0; let total = 0
        const profileAge = getAge(data.date_of_birth)
        if (me.pref_age_min || me.pref_age_max) {
          total++
          if (profileAge && profileAge >= (me.pref_age_min || 0) && profileAge <= (me.pref_age_max || 99)) match++
        }
        if (me.religion) { total++; if (data.religion?.toLowerCase() === me.religion?.toLowerCase()) match++ }
        if (me.caste) { total++; if (data.caste?.toLowerCase() === me.caste?.toLowerCase()) match++ }
        if (me.mother_tongue) { total++; if (data.mother_tongue?.toLowerCase() === me.mother_tongue?.toLowerCase()) match++ }
        if (me.native_district) { total++; if (data.native_district === me.native_district) match++ }
        if (total > 0) setCompatScore({ match, total })
      }
    }
  }

  async function logView(myId: string) {
    await supabase.from('profile_views').insert({ viewer_id: myId, viewed_id: id as string }).then(() => {})
    // Notify the profile owner (throttle: only once per 12h per viewer)
    const { data: existingView } = await supabase.from('profile_views')
      .select('viewed_at').eq('viewer_id', myId).eq('viewed_id', id as string)
      .gte('viewed_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .limit(1)
    const isFirstViewRecently = !existingView || existingView.length <= 1
    if (isFirstViewRecently) {
      const [{ data: viewer }, { data: owner }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', myId).maybeSingle(),
        supabase.from('profiles').select('user_id').eq('id', id as string).maybeSingle(),
      ])
      if (owner?.user_id && viewer?.full_name) {
        supabase.from('notifications').insert({
          user_id: owner.user_id,
          type: 'profile_view',
          message: `${viewer.full_name} viewed your profile`,
          from_profile_id: myId,
          read: false,
          link: `/profile/${myId}`,
        }).then(() => {})
      }
    }
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
    if (match) { setViewerRelation('matched'); setChatMatchId(match.id); return }
    const { data: sent } = await supabase.from('interests').select('id')
      .eq('from_user', myId).eq('to_user', id as string).maybeSingle()
    if (sent) {
      setViewerRelation('interested')
      setInterestSent(true)
      // Look up match created when interest was sent
      const { data: m } = await supabase.from('matches').select('id')
        .or(`and(user1.eq.${myId},user2.eq.${id}),and(user1.eq.${id},user2.eq.${myId})`)
        .maybeSingle()
      if (m) setChatMatchId(m.id)
      return
    }
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

    // Block if no photo
    if (!profile?.photo_url) {
      setToast('Add a profile photo before expressing interest')
      setTimeout(() => setToast(null), 3500)
      return
    }

    // Rate limit: max 10 interests per hour
    const key = 'interest_timestamps'
    const now = Date.now()
    const stored: number[] = JSON.parse(localStorage.getItem(key) || '[]')
    const recent = stored.filter(t => now - t < 60 * 60 * 1000)
    if (recent.length >= 10) {
      setToast("You're sending too many interests. Please wait before sending more.")
      setTimeout(() => setToast(null), 4000)
      return
    }
    localStorage.setItem(key, JSON.stringify([...recent, now]))

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
            subject: 'New Interest — NativeMatrimony',
            html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#111827">You have a new interest!</h2>
              <p style="color:#4B5563"><strong>${me?.full_name || 'Someone'}</strong> sent you an interest on NativeMatrimony.</p>
              ${note?.trim() ? `<blockquote style="border-left:3px solid #9B1C1C;margin:16px 0;padding:8px 16px;color:#4B5563;font-style:italic">"${note.trim()}"</blockquote>` : ''}
              <a href="https://nativematrimony.com/interests" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#9B1C1C;color:white;border-radius:8px;text-decoration:none;font-weight:600">View &amp; Respond</a>
            </div>`
          })
        }).catch(() => {})
      }
    }

    setInterestSent(true)
    setSending(false)
    setShowNoteModal(false)
    showToast(`Interest sent to ${profile?.full_name || 'them'}. You'll be notified when they respond.`)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
      <div className="text-center">
        <p className="font-semibold text-gray-700">Profile not found</p>
        <Link href="/browse" className="text-sm underline mt-2 block" style={{ color: '#9B1C1C' }}>Back to browse</Link>
      </div>
    </div>
  )

  const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  const isOwnProfile = !previewMode && myProfileId === profile.id

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
      if (value) return <p className="font-semibold text-gray-700 text-sm">{value}</p>
      if (isOwnProfile) {
        const isRequired = label ? REQUIRED_FIELD_LABELS.has(label) : false
        const isRecommended = label ? RECOMMENDED_FIELD_LABELS.has(label) : false
        return (
          <Link href="/profile/edit" className="inline-flex items-center gap-1.5">
            {isRequired && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#FEF2F2', color: '#DC2626' }}>Required</span>
            )}
            {isRecommended && !isRequired && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#FFFBEB', color: '#9B1C1C' }}>Fill in</span>
            )}
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#9B1C1C' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </span>
          </Link>
        )
      }
      return <p className="text-sm text-gray-300">—</p>
    }

    // Hidden and not revealed
    const isPending = fieldKey ? fieldIsRequested(fieldKey) : false
    return (
      <div className="space-y-1">
        <p className="font-semibold text-gray-300 text-sm select-none" style={{ filter: 'blur(5px)', userSelect: 'none' }}>
          ██████████
        </p>
        {isLoggedIn && !isOwnProfile && (
          <button
            onClick={() => fieldKey && requestFields([fieldKey])}
            disabled={isPending || sendingFieldReq}
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all"
            style={isPending
              ? { background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }
              : { background: 'white', color: '#9B1C1C', borderColor: '#FECACA' }}>
            {isPending ? '✓ Requested' : 'Request'}
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
        { label: 'Siblings', value: (() => {
          if (!profile.siblings) return null
          try {
            const s = JSON.parse(profile.siblings)
            if (Array.isArray(s) && s.length > 0) {
              return s.map((sib: { name?: string; relation?: string; married?: boolean }) =>
                [sib.name, sib.relation, sib.married ? 'Married' : 'Unmarried'].filter(Boolean).join(' · ')
              ).join('\n')
            }
            // legacy {brothers, sisters} format
            const parts: string[] = []
            if (s.brothers != null) parts.push(`${s.brothers} brother${s.brothers !== 1 ? 's' : ''}`)
            if (s.sisters != null) parts.push(`${s.sisters} sister${s.sisters !== 1 ? 's' : ''}`)
            return parts.length ? parts.join(', ') : null
          } catch { return profile.siblings }
        })(), wide: true },
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
    <div className="min-h-screen pb-28" style={{ background: '#F9FAFB' }}>

      <AppHeader />

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm w-full pointer-events-auto"
            style={{ background: '#111827', color: 'white' }}>
            <span className="text-lg">✓</span>
            <p className="flex-1 text-xs">{toast}</p>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white ml-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {!isOwnProfile && (
        <div className="max-w-3xl mx-auto px-4 pt-3 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          {isLoggedIn && (
            <button onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50"
              style={{ color: '#DC2626', borderColor: '#FECACA' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Report
            </button>
          )}
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">

        {/* Hero card */}
        <div className="card overflow-hidden">
          {(() => {
            return (
              <div className="relative">
                {showPhoto ? (() => {
                  const allPhotos = [profile.photo_url, ...extraPhotos].filter(Boolean) as string[]
                  return (
                    <div className="relative" style={{ paddingBottom: '110%' }}>
                      <button onClick={() => setPhotoExpanded(true)} className="focus:outline-none absolute inset-0 w-full h-full group">
                        <img loading="lazy" src={allPhotos[photoIdx]} alt={profile.full_name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] cursor-zoom-in" />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity" />
                      </button>
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 40%, transparent 65%)' }} />
                      {allPhotos.length > 1 && (
                        <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center gap-2 pointer-events-auto">
                          <button onClick={() => setPhotoIdx(i => (i - 1 + allPhotos.length) % allPhotos.length)}
                            className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                          </button>
                          {allPhotos.map((_, i) => (
                            <button key={i} onClick={() => setPhotoIdx(i)}
                              className="w-1.5 h-1.5 rounded-full transition-all"
                              style={{ background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.5)' }} />
                          ))}
                          <button onClick={() => setPhotoIdx(i => (i + 1) % allPhotos.length)}
                            className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })() : (
                  <div className="relative" style={{ background: 'linear-gradient(160deg, #FEF2F2 0%, #FFF7F0 100%)', paddingBottom: '80%' }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                      style={{ background: avatarBg(profile.full_name) }}>
                      {initials(profile.full_name)}
                    </div>
                    {isOwnProfile && !profile.photo_url && (
                      <label className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap cursor-pointer">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full border shadow-sm flex items-center gap-1"
                          style={{ background: 'white', color: '#9B1C1C', borderColor: '#FECACA' }}>
                          {uploadingPhoto ? 'Uploading…' : '+ Add photo'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0]
                          const myId = localStorage.getItem('my_profile_id')
                          if (!file || !myId) return
                          setUploadingPhoto(true)
                          const ext = file.name.split('.').pop()
                          const fileName = `${myId}/main.${ext}`
                          const { error: upErr } = await supabase.storage.from('profile-photos').upload(fileName, file, { upsert: true })
                          if (!upErr) {
                            const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName)
                            await supabase.from('profiles').update({ photo_url: urlData.publicUrl }).eq('id', myId)
                            window.location.reload()
                          }
                          setUploadingPhoto(false)
                        }} />
                      </label>
                    )}
                    {profile.photo_url && photoHidden && !photoRevealed && isLoggedIn && !isOwnProfile && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <button
                          onClick={() => requestFields(['photo'])}
                          disabled={fieldIsRequested('photo') || sendingFieldReq}
                          className="text-xs font-semibold px-3 py-1 rounded-full border transition-all shadow-sm"
                          style={fieldIsRequested('photo')
                            ? { background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }
                            : { background: 'white', color: '#9B1C1C', borderColor: '#FECACA' }}>
                          {fieldIsRequested('photo') ? '✓ Photo requested' : 'Request photo'}
                        </button>
                      </div>
                    )}
                  </div>
                  </div>
                )}

              </div>
            )
          })()}

          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-serif-display tracking-tight">{profile.full_name}</h1>
                <p className="text-gray-500 mt-0.5 text-sm">
                  {[
                    getAge(profile.date_of_birth) != null ? `${getAge(profile.date_of_birth)} yrs` : null,
                    profile.height_cm ? cmToFeet(profile.height_cm).split(' ')[0] : null,
                    profile.gender === 'male' ? 'Groom' : 'Bride',
                  ].filter(Boolean).join(' · ')}
                </p>
                {lastSeenLabel(profile.last_login_at) && (
                  <p className="text-xs text-gray-400 mt-0.5">{lastSeenLabel(profile.last_login_at)}</p>
                )}
              </div>
              {(profile.verified || profile.phone_verified) ? (
                <div className="relative shrink-0 mt-1">
                  <button onClick={() => setVerifiedOpen(v => !v)}
                    className="badge badge-verified cursor-pointer select-none">✓ Verified</button>
                  {verifiedOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 px-3 py-2.5 rounded-lg text-xs text-white z-50 leading-relaxed shadow-xl"
                      style={{ background: '#111827' }}>
                      <p className="font-semibold mb-0.5">What does Verified mean?</p>
                      <p className="text-gray-300">{profile.verified ? 'Phone number confirmed + community review completed.' : 'Phone number confirmed.'}</p>
                      <div className="absolute top-full right-3 border-4 border-transparent" style={{ borderTopColor: '#111827' }} />
                    </div>
                  )}
                </div>
              ) : myProfileId === profile.id ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0 mt-1"
                  style={{ background: '#FFFBEB', color: '#7F1D1D', border: '1px solid #FDE68A' }}>
                  Verification pending · up to 24h
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              {/* Native place badge */}
              <span className="badge badge-native text-sm px-3 py-1.5 flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <span>
                  Native:{' '}
                  {fieldIsHidden('native_location') && !isOwnProfile && !fieldIsRevealed('native_location')
                    ? profile.native_state
                    : profile.native_district}
                  {profile.current_city && (
                    <span className="text-gray-400"> | {profile.current_city}</span>
                  )}
                </span>
              </span>
              {isSerious(profile) && (
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: '#FEF2F2', color: '#7F1D1D', border: '1px solid #FECACA' }}>
                  ★ Serious Seeker
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Founder member badge — own profile only */}
        {isOwnProfile && profile.member_number && (
          <div className="card px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #7F1D1D, #9B1C1C)' }}>
                #{profile.member_number}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Founder Member #{profile.member_number}</p>
                <p className="text-xs text-gray-400">
                  {profile.premium_expires_at
                    ? `Free premium until ${new Date(profile.premium_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'Free premium active'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: '#9B1C1C' }}>★ Founder</span>
          </div>
        )}

        {/* Who viewed you — own profile */}
        {isOwnProfile && viewers.length > 0 && (
          <div className="card px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">Who viewed your profile</p>
              <span className="text-xs text-gray-400">{viewers.length} recent</span>
            </div>
            <div className="space-y-3">
              {viewers.slice(0, 8).map(v => (
                <Link key={v.viewer_id} href={`/profile/${v.viewer_id}`}
                  className="flex items-center gap-3 group">
                  {v.photo_url && v.photo_visibility === 'public' ? (
                    <img loading="lazy" src={v.photo_url} alt={v.full_name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: avatarBg(v.full_name) }}>
                      {initials(v.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 group-hover:underline truncate">{v.full_name}</p>
                    <p className="text-xs text-gray-400">{timeAgo(v.viewed_at)}</p>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Profile completeness — own profile only */}
        {isOwnProfile && (() => {
          const coreFields: [boolean, string][] = [
            [!!profile.photo_url, 'Profile photo'],
            [!!profile.about, 'About me'],
            [!!profile.height_cm, 'Height'],
            [!!profile.caste, 'Caste'],
            [!!profile.education, 'Education'],
            [!!profile.profession, 'Profession'],
            [!!profile.family_type, 'Family type'],
            [!!profile.mother_tongue, 'Mother tongue'],
            [!!profile.religion, 'Religion'],
            [!!profile.native_district, 'Native district'],
            [!!profile.gotra, 'Gotram'],
            [!!(profile.pref_age_min || profile.pref_age_max), 'Partner preferences'],
          ]
          const filled = coreFields.filter(([v]) => v).length
          const pct = Math.round((filled / coreFields.length) * 100)
          const missing = coreFields.filter(([v]) => !v).map(([, label]) => label).slice(0, 3)
          return (
            <div className="card px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-800">Profile completeness</p>
                <span className="text-sm font-bold" style={{ color: pct >= 80 ? '#059669' : '#9B1C1C' }}>{pct}%</span>
              </div>
              <div className="w-full rounded-full h-2 mb-3" style={{ background: '#F0EDE8' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? '#059669' : '#9B1C1C' }} />
              </div>
              {missing.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Missing: {missing.join(', ')}</p>
                  <Link href="/profile/edit" className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: '#FEF2F2', color: '#9B1C1C' }}>
                    Complete profile →
                  </Link>
                </div>
              )}
              {pct === 100 && <p className="text-xs text-gray-400">Great job — your profile is complete!</p>}
            </div>
          )
        })()}

        {/* Incoming field requests — own profile */}
        {isOwnProfile && incomingRequests.length > 0 && (
          <div className="card px-5 py-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Info requests
              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#DC2626' }}>
                {incomingRequests.length}
              </span>
            </p>
            <div className="space-y-3">
              {incomingRequests.map(req => (
                <div key={req.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FFFBF5', border: '1px solid #F0EDE8' }}>
                  {req.photo_url && req.photo_visibility === 'public' ? (
                    <img loading="lazy" src={req.photo_url} alt={req.full_name}
                      className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: avatarBg(req.full_name) }}>
                      {initials(req.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{req.full_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
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
                        style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
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
        <div className="card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B1C1C', margin: '0 0 16px' }}>Quick facts</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 12px' }}>
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
          ].map((r) => (
            <div key={r.label} style={{ minWidth: 0 }}>
              <p style={{ fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B0B7C3', margin: '0 0 4px' }}>{r.label}</p>
              {r.hidden ? (
                <div>
                  <p className="font-semibold text-gray-300 text-sm select-none" style={{ filter: 'blur(5px)', userSelect: 'none' }}>██████</p>
                  {isLoggedIn && !isOwnProfile && (
                    <button
                      onClick={() => requestFields(['current_city'])}
                      disabled={fieldIsRequested('current_city') || sendingFieldReq}
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all"
                      style={fieldIsRequested('current_city')
                        ? { background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }
                        : { background: 'white', color: '#9B1C1C', borderColor: '#FECACA' }}>
                      {fieldIsRequested('current_city') ? '✓ Requested' : 'Request'}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.value || '—'}</div>
                  {r.sub && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{r.sub}</div>}
                </>
              )}
            </div>
          ))}
          </div>
        </div>

        {/* About */}
        {(profile.about || isOwnProfile) && (
          <div className="card px-6 py-5">
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B1C1C', margin: '0 0 10px' }}>About</p>
            {profile.about ? (
              <p className="text-gray-600 leading-relaxed text-sm">"{profile.about}"</p>
            ) : (
              <Link href="/profile/edit" className="text-sm font-medium flex items-center gap-1" style={{ color: '#9B1C1C' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add a bio — tell people about yourself
              </Link>
            )}
          </div>
        )}

        {/* Looking for / Partner preferences */}
        {(() => {
          const hasPrefs = profile.pref_age_min || profile.pref_age_max
          if (!hasPrefs && !isOwnProfile) return null
          return (
            <div className="card px-6 py-5">
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B1C1C', margin: '0 0 12px' }}>Looking for</p>
              {hasPrefs ? (
                <div className="flex flex-wrap gap-2">
                  {(profile.pref_age_min || profile.pref_age_max) && (
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ background: '#FEF2F2', color: '#7F1D1D' }}>
                      Age {profile.pref_age_min || '—'}–{profile.pref_age_max || '—'} yrs
                    </span>
                  )}
                </div>
              ) : isOwnProfile ? (
                <Link href="/profile/edit" className="text-sm font-medium flex items-center gap-1" style={{ color: '#9B1C1C' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add partner preferences so matches know you're a fit
                </Link>
              ) : null}
            </div>
          )
        })()}

        {/* Compatibility bar — only shown to non-owners who are logged in */}
        {compatScore && !isOwnProfile && myProfileId && (
          <div className="card px-6 py-4">
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B1C1C', margin: '0 0 10px' }}>Compatibility</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '8px', borderRadius: '99px', background: '#F3F4F6', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((compatScore.match / compatScore.total) * 100)}%`, borderRadius: '99px', background: compatScore.match >= compatScore.total * 0.7 ? '#16A34A' : compatScore.match >= compatScore.total * 0.4 ? '#D97706' : '#9B1C1C', transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F0F0F', whiteSpace: 'nowrap' }}>
                {compatScore.match}/{compatScore.total} match
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#9CA3AF', margin: '6px 0 0' }}>
              Based on age, religion, caste, mother tongue, and native place
            </p>
          </div>
        )}

        {/* Full biodata — always visible, hidden fields blurred */}
        <div className="card px-6 py-5">
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B1C1C', margin: '0 0 16px' }}>Full biodata</p>
          <div className="space-y-0">
            {bioSections.map((section, si) => (
              <div key={section.heading} className={si > 0 ? 'pt-4 mt-4 border-t' : ''} style={si > 0 ? { borderColor: '#F3F4F6' } : {}}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9B1C1C', margin: '0 0 12px' }}>{section.heading}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {section.rows.map(f => (
                    <div key={f.label} className={f.wide ? 'col-span-2' : ''}>
                      <p style={{ fontSize: '10.5px', color: '#B0B7C3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
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
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B1C1C', margin: '0 0 12px' }}>Contact</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {profile.phone && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                    {phoneHidden ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-300 text-sm select-none" style={{ filter: 'blur(5px)', userSelect: 'none' }}>██████████</p>
                        {isLoggedIn && !isOwnProfile && (
                          <button
                            onClick={() => requestFields(['phone'])}
                            disabled={fieldIsRequested('phone') || sendingFieldReq}
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all"
                            style={fieldIsRequested('phone')
                              ? { background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }
                              : { background: 'white', color: '#9B1C1C', borderColor: '#FECACA' }}>
                            {fieldIsRequested('phone') ? '✓ Requested' : 'Request'}
                          </button>
                        )}
                      </div>
                    ) : showContact ? (
                      <p className="font-semibold text-gray-700 text-sm">{profile.phone}</p>
                    ) : (
                      <p className="font-semibold text-gray-300 text-sm">—</p>
                    )}
                  </div>
                )}
                {profile.email && showContact && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="font-semibold text-gray-700 text-sm">{profile.email}</p>
                  </div>
                )}
              </div>
              {!showContact && !isOwnProfile && (
                <p className="text-xs text-gray-400 mt-2">Contact details unlock after mutual match</p>
              )}
            </div>
          )
        })()}
      </div>

      {/* Similar profiles row */}
      {similarProfiles.length > 0 && (
        <div className="card px-6 py-5">
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B1C1C', margin: '0 0 14px' }}>Similar profiles</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {similarProfiles.map(p => {
              const age = getAge(p.date_of_birth)
              const showPhoto = !!(p.photo_url && p.photo_visibility === 'public')
              return (
                <Link key={p.id} href={`/profile/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', border: '1px solid #F3F4F6', textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#FAFAFA'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#F3F4F6' }}>
                    {showPhoto ? (
                      <img loading="lazy" src={p.photo_url!} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#9B1C1C', color: 'white', fontSize: '14px', fontWeight: 700 }}>
                        {p.full_name.slice(0,2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F0F0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.full_name.split(' ')[0]}{age ? `, ${age}` : ''}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.native_district || p.profession || '—'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Report modal trigger is now in header bar */}

      {/* Personalized Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setShowNoteModal(false)}>
          <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 font-serif-display">Break the ice</h3>
                <p className="text-xs text-gray-400 mt-0.5">Add a personal note — optional but encouraged</p>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-300 hover:text-gray-500 ml-3 mt-0.5">
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
            <p className="text-xs text-gray-400 text-right mt-1">{noteText.length}/200</p>
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => expressInterest()}
                disabled={sending}
                className="flex-1 btn-ghost py-2.5 text-sm">
                Send without note
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
            <h3 className="font-bold text-gray-900 font-serif-display mb-4">Report profile</h3>
            {reportSent ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✓</p>
                <p className="font-semibold text-gray-700">Report submitted</p>
                <p className="text-xs text-gray-400 mt-1">Our team will review this within 24 hours.</p>
                <button onClick={() => setShowReportModal(false)} className="btn-ghost mt-4 px-6 py-2 text-sm">Close</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-4">Select a reason</p>
                <div className="space-y-2 mb-5">
                  {['Fake or scam profile', 'Inappropriate content or photo', 'Harassment or abusive behaviour', 'Married / misleading information', 'Other'].map(r => (
                    <label key={r} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
                      style={{ borderColor: reportReason === r ? '#9B1C1C' : '#E5E7EB', background: reportReason === r ? '#FEF2F2' : 'white' }}>
                      <input type="radio" name="report_reason" value={r} checked={reportReason === r}
                        onChange={() => setReportReason(r)} className="accent-amber-700" />
                      <span className="text-sm text-gray-700">{r}</span>
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
                      const reportCount = parseInt(sessionStorage.getItem('report_count') || '0')
                      if (reportCount >= 3) {
                        setShowReportModal(false)
                        setToast('You have reached the report limit for this session.')
                        setTimeout(() => setToast(null), 3500)
                        return
                      }
                      await supabase.from('reports').insert({ reporter: myId, reported: id as string, reason: reportReason }).then(() => {})
                      sessionStorage.setItem('report_count', String(reportCount + 1))
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
                <img loading="lazy" src={allPhotos[photoIdx]} alt={profile.full_name}
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
        style={{ borderColor: '#E5E7EB', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}>
        <div className="max-w-3xl mx-auto">
          {myProfileId === profile.id ? (
            <div className="flex items-center justify-around py-1">
              <Link href="/browse" className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl hover:bg-gray-50 transition-colors" style={{ color: '#6B7280' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span className="text-[10px] font-medium">Home</span>
              </Link>
              <Link href="/profile/edit" className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl hover:bg-gray-50 transition-colors" style={{ color: '#9B1C1C' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span className="text-[10px] font-medium">Edit</span>
              </Link>
              <Link href="/profile/edit?section=privacy" className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl hover:bg-gray-50 transition-colors" style={{ color: '#6B7280' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="text-[10px] font-medium">Privacy</span>
              </Link>
              <a href={`/profile/${profile.id}?preview=1`} target="_blank" rel="noopener"
                className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl hover:bg-gray-50 transition-colors" style={{ color: '#6B7280' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span className="text-[10px] font-medium">Preview</span>
              </a>
            </div>
          ) : isLoggedIn ? (
            <>
              <div className="flex gap-2.5">
                {chatMatchId ? (
                  <Link href={`/chat/${chatMatchId}`} className="flex-1 btn-primary py-3 text-sm text-center">
                    Message
                  </Link>
                ) : interestSent ? (
                  <button
                    onClick={async () => {
                      const myId = localStorage.getItem('my_profile_id')
                      if (!myId) return
                      const { data: existing } = await supabase.from('matches').select('id')
                        .or(`and(user1.eq.${myId},user2.eq.${id}),and(user1.eq.${id},user2.eq.${myId})`)
                        .maybeSingle()
                      let mId = existing?.id
                      if (!mId) {
                        const { data: created } = await supabase.from('matches')
                          .insert({ user1: myId, user2: id as string }).select('id').single()
                        mId = created?.id
                      }
                      if (mId) router.push(`/chat/${mId}`)
                    }}
                    className="flex-1 btn-primary py-3 text-sm"
                  >
                    Message
                  </button>
                ) : (
                  <button
                    onClick={openNoteModal}
                    disabled={sending}
                    className="flex-1 btn-primary py-3 text-sm"
                  >
                    {sending ? 'Sending...' : 'Express Interest'}
                  </button>
                )}
                <button
                  onClick={() => setShortlisted(s => !s)}
                  className="px-4 py-3 rounded-lg font-semibold text-sm border transition-all"
                  style={shortlisted
                    ? { background: '#FEF2F2', color: '#7F1D1D', borderColor: '#FECACA' }
                    : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }}>
                  {shortlisted ? '★ Saved' : '☆ Save'}
                </button>
              </div>
              {!interestSent && !chatMatchId && (
                <div className="flex justify-center mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
                    style={{ background: '#FEF2F2', color: '#7F1D1D' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Sending interest opens a chat instantly
                  </span>
                </div>
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
                  style={{ background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }}>
                  Login
                </Link>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">Free until September 2026 · No credit card needed</p>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
