'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import IndiaMap from '../components/IndiaMap'
import MobileNav from '../components/MobileNav'
import LaunchBanner from '../components/LaunchBanner'
import AppHeader from '../components/AppHeader'

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

const AGE_RANGES = ['18–24', '25–29', '30–34', '35–40', '40+']
const PROFESSIONS = ['IT / Software', 'Business', 'Government', 'Healthcare', 'Education', 'Other']
const PROF_KEYWORDS: Record<string, string[]> = {
  'IT / Software': ['software', 'engineer', 'developer', 'it ', 'tech'],
  'Business': ['business', 'entrepreneur', 'owner', 'trader'],
  'Government': ['government', 'ias', 'ips', 'civil', 'bank', 'railway'],
  'Healthcare': ['doctor', 'nurse', 'physician', 'medical', 'pharma'],
  'Education': ['teacher', 'professor', 'lecturer', 'faculty'],
}
const MOTHER_TONGUES = ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'English']
const CASTES = ['Reddy', 'Kamma', 'Kapu', 'Brahmin', 'Velama', 'Yadav', 'SC/ST', 'OBC']

// Height presets in cm
const HEIGHT_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Below 5\'2"', min: 0,   max: 157 },
  { label: '5\'2"–5\'5"', min: 157, max: 165 },
  { label: '5\'5"–5\'8"', min: 165, max: 173 },
  { label: '5\'8"–5\'11"',min: 173, max: 181 },
  { label: 'Above 5\'11"',min: 181, max: 999 },
]

const MARITAL_OPTIONS = [
  { value: 'never_married', label: 'Never married' },
  { value: 'divorced',      label: 'Divorced' },
  { value: 'widowed',       label: 'Widowed' },
]

type Profile = {
  id: string
  full_name: string
  gender: string
  date_of_birth: string
  profession: string
  education: string
  about: string
  height_cm: number
  photo_url: string
  photo_visibility: string | null
  caste: string
  native_district: string
  native_state: string
  native_region: string
  current_city: string
  verified: boolean
  phone_verified: boolean
  marital_status: string | null
  last_login_at: string | null
  mother_tongue: string | null
  created_at: string
  religion: string | null
  family_type: string | null
  user_id: string | null
  hidden_fields: string[] | null
}

type ActivitySummary = {
  pendingReceived: number
  accepted: number
  totalMatches: number
}

function cmToFeet(cm: number): string {
  const ft = Math.floor(cm / 30.48)
  const inches = Math.round((cm % 30.48) / 2.54)
  return `${ft}'${inches}"`
}

function lastSeen(ts: string | null): string | null {
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

function isVerified(p: Pick<Profile, 'verified' | 'phone_verified'>): boolean {
  return p.verified || p.phone_verified
}

function isSerious(p: Pick<Profile, 'education' | 'about' | 'height_cm' | 'photo_url' | 'caste'>): boolean {
  return [p.education, p.about, p.height_cm, p.photo_url, p.caste].filter(Boolean).length >= 3
}

function getAge(dob: string): number | null {
  if (!dob) return null
  const age = Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return age > 0 ? age : null
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function avatarBg(_name: string) { return '#DDD5CA' }

const INTEREST_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  matched:  { label: 'Matched ✓',     bg: '#ECFDF5', color: '#065F46' },
  accepted: { label: 'Accepted ✓',    bg: '#ECFDF5', color: '#065F46' },
  pending:  { label: 'Interest Sent', bg: '#FEF2F2', color: '#7F1D1D' },
  rejected: { label: 'Declined',      bg: '#FEF2F2', color: '#991B1B' },
}

function FilterChips({ options, selected, onToggle }: {
  options: { value: string; label: string }[]
  selected: string
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o.value} onClick={() => onToggle(o.value)}
          className="text-xs px-2.5 py-1 rounded-md border font-medium transition-all"
          style={selected === o.value
            ? { background: '#9B1C1C', color: 'white', borderColor: '#9B1C1C' }
            : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function MultiChips({ options, selected, onToggle }: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} onClick={() => onToggle(o)}
          className="text-xs px-2.5 py-1 rounded-md border font-medium transition-all"
          style={selected.includes(o)
            ? { background: '#9B1C1C', color: 'white', borderColor: '#9B1C1C' }
            : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
          {o}
        </button>
      ))}
    </div>
  )
}

export default function BrowsePage() {
  const [sessionChecked, setSessionChecked] = useState(false)
  const [myGender, setMyGender] = useState<string | null>(null)
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [activity, setActivity] = useState<ActivitySummary | null>(null)

  // Filters
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [profCat, setProfCat] = useState('')
  const [maritalFilter, setMaritalFilter] = useState('')
  const [heightRange, setHeightRange] = useState('')
  const [motherTongues, setMotherTongues] = useState<string[]>([])
  const [casteFilter, setCasteFilter] = useState('')
  const [photoOnly, setPhotoOnly] = useState(false)
  const [recentOnly, setRecentOnly] = useState(false)

  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [alertSet, setAlertSet] = useState(false)
  const [interestMap, setInterestMap] = useState<Record<string, string>>({})
  const [quickView, setQuickView] = useState<Profile | null>(null)
  const [sendingInterest, setSendingInterest] = useState(false)

  const availableStates = region ? Object.keys(REGIONS[region] || {}) : []
  const availableDistricts = state ? (REGIONS[region]?.[state] || []) : []
  const oppositeGender = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : null

  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    setMyProfileId(myId)
    if (!myId) { setSessionChecked(true); return }
    supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', myId).then(() => {})
    Promise.all([
      supabase.from('profiles').select('gender').eq('id', myId).maybeSingle(),
      supabase.from('interests').select('to_user, status').eq('from_user', myId),
      supabase.from('matches').select('user1, user2').or(`user1.eq.${myId},user2.eq.${myId}`),
      // Activity summary
      supabase.from('interests').select('id', { count: 'exact', head: true }).eq('to_user', myId).eq('status', 'pending'),
      supabase.from('interests').select('id', { count: 'exact', head: true }).eq('to_user', myId).eq('status', 'accepted'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).or(`user1.eq.${myId},user2.eq.${myId}`),
    ]).then(([{ data: profile }, { data: interests }, { data: matches }, pendingRes, acceptedRes, matchesRes]) => {
      if (!profile) {
        localStorage.removeItem('my_profile_id')
        setMyProfileId(null)
      }
      setMyGender(profile?.gender ?? null)
      const map: Record<string, string> = {}
      interests?.forEach(i => { map[i.to_user] = i.status })
      matches?.forEach(m => {
        const other = m.user1 === myId ? m.user2 : m.user1
        map[other] = 'matched'
      })
      setInterestMap(map)
      setActivity({
        pendingReceived: pendingRes.count || 0,
        accepted: acceptedRes.count || 0,
        totalMatches: matchesRes.count || 0,
      })
      setSessionChecked(true)
    })
  }, [])

  useEffect(() => {
    if (sessionChecked) loadProfiles()
  }, [sessionChecked, oppositeGender, region, state, district, ageRange, profCat, maritalFilter,
      heightRange, motherTongues, casteFilter, photoOnly, recentOnly, myProfileId])

  async function loadProfiles() {
    setLoading(true)

    function buildBase() {
      let q = supabase.from('profiles').select('*').eq('status', 'approved')
      if (oppositeGender) q = q.eq('gender', oppositeGender)
      if (region) q = q.eq('native_region', region)
      if (state) q = q.eq('native_state', state)
      if (district) q = q.eq('native_district', district)
      if (casteFilter) q = q.ilike('caste', `%${casteFilter}%`)
      return q
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const orClause = `last_login_at.gt.${fourteenDaysAgo},last_login_at.is.null`

    let base = buildBase()
    if (myProfileId) base = base.neq('id', myProfileId)
    let { data, error } = await base.or(orClause).order('created_at', { ascending: false })
    if (error) {
      const result = await buildBase().order('created_at', { ascending: false })
      data = result.data
    }

    let results = data || []

    // Client-side filters
    if (ageRange) {
      const [minA, maxA] = ageRange === '40+' ? [40, 99] : ageRange.split('–').map(Number)
      results = results.filter(p => { const a = getAge(p.date_of_birth); return a != null && a >= minA && a <= maxA })
    }
    if (profCat) {
      const kws = PROF_KEYWORDS[profCat] || []
      if (kws.length) results = results.filter(p => kws.some(k => p.profession?.toLowerCase().includes(k)))
    }
    if (maritalFilter) {
      results = results.filter(p => (p.marital_status || 'never_married') === maritalFilter)
    }
    if (heightRange) {
      const hr = HEIGHT_RANGES.find(h => h.label === heightRange)
      if (hr) results = results.filter(p => p.height_cm && p.height_cm >= hr.min && p.height_cm < hr.max)
    }
    if (motherTongues.length > 0) {
      results = results.filter(p => p.mother_tongue && motherTongues.includes(p.mother_tongue))
    }
    if (photoOnly) {
      results = results.filter(p => !!p.photo_url)
    }
    if (recentOnly) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      results = results.filter(p => new Date(p.created_at) >= thirtyDaysAgo)
    }

    setProfiles(results)
    setLoading(false)
  }

  function handleMapRegion(r: string) { setRegion(r); setState(''); setDistrict(''); setAlertSet(false) }
  function clearAll() {
    setRegion(''); setState(''); setDistrict(''); setAgeRange(''); setProfCat('')
    setMaritalFilter(''); setHeightRange(''); setMotherTongues([]); setCasteFilter('')
    setPhotoOnly(false); setRecentOnly(false); setAlertSet(false)
  }

  function toggleMotherTongue(mt: string) {
    setMotherTongues(prev => prev.includes(mt) ? prev.filter(x => x !== mt) : [...prev, mt])
  }

  function handleSetAlert() {
    const key = district || state || region
    if (!key) return
    const existing: string[] = JSON.parse(localStorage.getItem('region_alerts') || '[]')
    if (!existing.includes(key)) localStorage.setItem('region_alerts', JSON.stringify([...existing, key]))
    setAlertSet(true)
  }

  useEffect(() => {
    const key = district || state || region
    if (!key) { setAlertSet(false); return }
    const existing: string[] = JSON.parse(localStorage.getItem('region_alerts') || '[]')
    setAlertSet(existing.includes(key))
  }, [region, state, district])

  const activeFilterCount = [region, state, district, ageRange, profCat, maritalFilter, heightRange, casteFilter,
    photoOnly ? 'photo' : '', recentOnly ? 'recent' : '', ...motherTongues].filter(Boolean).length

  if (!sessionChecked) return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}><AppHeader />
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading...</div>
    </div>
  )

  if (!myProfileId) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6" style={{ background: '#F9FAFB' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ background: '#FEF2F2' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 font-serif-display mb-2">Create your profile first</h2>
        <p className="text-gray-500 text-sm max-w-xs">You need a complete profile before you can browse and connect with matches.</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/register" className="btn-primary py-3 text-center text-sm">Create Profile</Link>
        <Link href="/login" className="btn-ghost py-3 text-center text-sm">Sign in</Link>
      </div>
    </div>
  )

  const genderLabelPlural = oppositeGender === 'female' ? 'brides' : oppositeGender === 'male' ? 'grooms' : 'profiles'

  // Sidebar filter sections reused in both desktop and mobile
  const FilterSections = ({ compact }: { compact?: boolean }) => (
    <div className={compact ? 'space-y-4' : 'space-y-4'}>
      {region && (
        <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
          <select className="input text-sm" value={state} onChange={e => { setState(e.target.value); setDistrict('') }}>
            <option value="">All states</option>
            {availableStates.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input text-sm" value={district} onChange={e => setDistrict(e.target.value)} disabled={!state}>
            <option value="">All districts</option>
            {availableDistricts.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      )}

      <div>
        <p className="section-label mb-2">Age</p>
        <div className="flex gap-1.5 flex-wrap">
          {AGE_RANGES.map(a => (
            <button key={a} onClick={() => setAgeRange(r => r === a ? '' : a)}
              className="text-xs px-2.5 py-1.5 rounded-md border font-medium transition-all"
              style={ageRange === a ? { background: '#9B1C1C', color: 'white', borderColor: '#9B1C1C' } : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="section-label mb-2">Height</p>
        <div className="flex gap-1.5 flex-wrap">
          {HEIGHT_RANGES.map(h => (
            <button key={h.label} onClick={() => setHeightRange(r => r === h.label ? '' : h.label)}
              className="text-xs px-2.5 py-1.5 rounded-md border font-medium transition-all"
              style={heightRange === h.label ? { background: '#9B1C1C', color: 'white', borderColor: '#9B1C1C' } : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="section-label mb-2">Mother tongue</p>
        <MultiChips options={MOTHER_TONGUES} selected={motherTongues} onToggle={toggleMotherTongue} />
      </div>

      <div>
        <p className="section-label mb-2">Community / Caste</p>
        <MultiChips options={CASTES} selected={casteFilter ? [casteFilter] : []}
          onToggle={v => setCasteFilter(c => c === v ? '' : v)} />
      </div>

      <div>
        <p className="section-label mb-2">Marital status</p>
        <FilterChips options={MARITAL_OPTIONS} selected={maritalFilter} onToggle={v => setMaritalFilter(f => f === v ? '' : v)} />
      </div>

      <div>
        <p className="section-label mb-2">Profession</p>
        <FilterChips options={PROFESSIONS.map(p => ({ value: p, label: p }))} selected={profCat} onToggle={v => setProfCat(c => c === v ? '' : v)} />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={photoOnly} onChange={e => setPhotoOnly(e.target.checked)} className="accent-amber-700" />
          <span className="text-xs text-gray-600 font-medium">With photo only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={recentOnly} onChange={e => setRecentOnly(e.target.checked)} className="accent-amber-700" />
          <span className="text-xs text-gray-600 font-medium">Joined in last 30 days</span>
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 font-medium">
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#F9FAFB' }}>
      <AppHeader />
      <LaunchBanner />

      <div className="max-w-6xl mx-auto px-4 py-5">

        {/* Activity summary strip */}
        {activity && myProfileId && (activity.pendingReceived > 0 || activity.totalMatches > 0) && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl border" style={{ background: 'white', borderColor: '#E5E7EB' }}>
            {activity.pendingReceived > 0 && (
              <Link href="/interests" className="flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: '#9B1C1C' }}>
                <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#9B1C1C' }}>{activity.pendingReceived}</span>
                {activity.pendingReceived === 1 ? 'new interest' : 'new interests'}
              </Link>
            )}
            {activity.pendingReceived > 0 && activity.totalMatches > 0 && (
              <span className="text-gray-200">·</span>
            )}
            {activity.totalMatches > 0 && (
              <Link href="/matches" className="flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: '#059669' }}>
                <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#059669' }}>{activity.totalMatches}</span>
                {activity.totalMatches === 1 ? 'match' : 'matches'} — <span className="font-medium">start chatting</span>
              </Link>
            )}
          </div>
        )}

        {!myGender && (
          <div className="rounded-lg border px-4 py-3 mb-4 flex items-center justify-between gap-4"
            style={{ background: 'white', borderColor: '#E5E7EB' }}>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Register for better matches.</span>{' '}
              We filter by your native region and show compatible profiles.
            </p>
            <div className="flex gap-2 shrink-0">
              <Link href="/login" className="btn-ghost text-xs px-3 py-1.5">Login</Link>
              <Link href="/register" className="btn-primary text-xs px-3 py-1.5">Register Free</Link>
            </div>
          </div>
        )}

        <div className="flex gap-5">

          {/* Desktop sidebar */}
          <aside className="hidden sm:flex flex-col gap-4 w-60 shrink-0">
            <div className="card p-4">
              <p className="section-label mb-3">Filter by region</p>
              <IndiaMap mode="filter" selectedRegion={region} onRegionClick={handleMapRegion} compact />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Telangana', 'Coastal Andhra', 'Rayalaseema'].map(r => (
                  <button key={r} onClick={() => handleMapRegion(region === r ? '' : r)}
                    className="text-xs px-2.5 py-1 rounded-md border font-medium transition-all"
                    style={region === r
                      ? { background: '#FEF2F2', color: '#9B1C1C', borderColor: '#FECACA' }
                      : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <FilterSections />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Mobile filter bar */}
            <div className="sm:hidden mb-4">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {['Telangana', 'Coastal Andhra', 'Rayalaseema'].map(r => (
                  <button key={r} onClick={() => handleMapRegion(region === r ? '' : r)}
                    className="text-xs px-3 py-2 rounded-lg border font-semibold shrink-0 transition-all"
                    style={region === r
                      ? { background: '#FEF2F2', color: '#9B1C1C', borderColor: '#FECACA' }
                      : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
                    {r}
                  </button>
                ))}
                <button onClick={() => setShowMoreFilters(f => !f)}
                  className="text-xs px-3 py-2 rounded-lg border font-semibold shrink-0 flex items-center gap-1.5"
                  style={activeFilterCount > 0
                    ? { background: '#FEF2F2', color: '#9B1C1C', borderColor: '#FECACA' }
                    : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
              </div>

              {showMoreFilters && (
                <div className="card p-4 mt-3">
                  <FilterSections compact />
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : (
                  <><span className="font-semibold text-gray-800">{profiles.length}</span> {genderLabelPlural} found</>
                )}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#9B1C1C' }} />
                ✓ Verified profiles marked
              </div>
            </div>

            {/* Empty state */}
            {!loading && profiles.length === 0 && (
              <div className="card p-8 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF2F2' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="1.75">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                {(region || state || district) ? (
                  <>
                    <p className="font-semibold text-gray-800 mb-1">No {genderLabelPlural} from {district || state || region} yet</p>
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed max-w-xs mx-auto">
                      Be the first from your area, or invite friends and family to join.
                    </p>
                    <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
                      {myProfileId && (
                        <button onClick={handleSetAlert} disabled={alertSet}
                          className={alertSet ? 'btn-ghost px-5 py-2.5 text-sm' : 'btn-primary px-5 py-2.5 text-sm'}>
                          {alertSet ? `✓ Alert set for ${district || state || region}` : 'Notify me when someone joins'}
                        </button>
                      )}
                      <button onClick={clearAll} className="btn-ghost px-5 py-2.5 text-sm text-gray-400">Show all {genderLabelPlural}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-700 mb-1">No profiles match these filters</p>
                    <p className="text-sm text-gray-400 mb-4">Try removing some filters to see more results.</p>
                    <button onClick={clearAll} className="btn-primary px-5 py-2 text-sm">Clear filters</button>
                  </>
                )}
              </div>
            )}

            {/* Profile grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {profiles.map(p => (
                <button key={p.id} onClick={() => setQuickView(p)} className="block group text-left w-full">
                  <div className="rounded-xl overflow-hidden bg-white active:scale-[0.98] transition-all duration-200 hover:shadow-lg"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>

                    {/* Photo — 4:5 ratio */}
                    <div className="relative" style={{ paddingBottom: '125%' }}>
                      {p.photo_url && p.photo_visibility === 'public' ? (
                        <img src={p.photo_url} alt={p.full_name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center"
                          style={{ background: 'linear-gradient(160deg, #F9FAFB 0%, #F3F4F6 100%)' }}>
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                            style={{ background: '#FEF2F2' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-500">{p.full_name.split(' ')[0]}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">No photo</span>
                        </div>
                      )}
                      {/* Gradient overlay for photo cards */}
                      {p.photo_url && p.photo_visibility === 'public' && (
                        <div className="absolute inset-0 pointer-events-none"
                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)' }} />
                      )}
                      {/* Status badges */}
                      {isVerified(p) && (
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm"
                            style={{ background: 'rgba(255,255,255,0.95)', color: '#059669' }}>✓ Verified</span>
                        </div>
                      )}
                      {interestMap[p.id] && (
                        <div className="absolute top-2.5 right-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm"
                            style={{
                              background: 'rgba(255,255,255,0.95)',
                              color: interestMap[p.id] === 'matched' ? '#059669' : interestMap[p.id] === 'rejected' ? '#DC2626' : '#9B1C1C',
                            }}>
                            {interestMap[p.id] === 'matched' ? 'Matched' : interestMap[p.id] === 'accepted' ? 'Accepted' : interestMap[p.id] === 'rejected' ? 'Declined' : 'Sent'}
                          </span>
                        </div>
                      )}
                      {/* Name + age on photo */}
                      {p.photo_url && p.photo_visibility === 'public' && (
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8">
                          <p className="text-white font-bold text-sm leading-tight drop-shadow-md">{p.full_name}</p>
                          <p className="text-white/80 text-xs mt-0.5 drop-shadow">
                            {getAge(p.date_of_birth) != null ? `${getAge(p.date_of_birth)} yrs` : ''}
                            {p.height_cm ? ` · ${cmToFeet(p.height_cm)}` : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Info below photo */}
                    <div className="px-3 pt-2.5 pb-3">
                      {/* Name + age for no-photo cards */}
                      {!(p.photo_url && p.photo_visibility === 'public') && (
                        <p className="font-bold text-gray-900 text-sm leading-tight truncate mb-1">
                          {p.full_name}
                          <span className="font-normal text-gray-500 ml-1 text-xs">
                            {getAge(p.date_of_birth) != null ? `${getAge(p.date_of_birth)} yrs` : ''}
                            {p.height_cm ? ` · ${cmToFeet(p.height_cm)}` : ''}
                          </span>
                        </p>
                      )}
                      <p className="text-xs font-medium text-gray-700 truncate">{p.profession || '—'}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {p.native_district}{p.current_city ? ` · ${p.current_city}` : ''}
                      </p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: '#9B1C1C' }}>
                        {lastSeen(p.last_login_at) ?? ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MobileNav />

      {/* Quick-view modal */}
      {quickView && (() => {
        const p = quickView
        const status = interestMap[p.id]
        const showPhoto = p.photo_url && p.photo_visibility === 'public'
        const age = getAge(p.date_of_birth)
        const seenLabel = lastSeen(p.last_login_at)

        async function handleInterest() {
          if (!myProfileId || status) return
          setSendingInterest(true)
          await supabase.from('interests').insert({ from_user: myProfileId, to_user: p.id, status: 'pending' })
          setInterestMap(m => ({ ...m, [p.id]: 'pending' }))
          // Notify recipient
          const { data: me } = await supabase.from('profiles').select('full_name, user_id').eq('id', myProfileId).maybeSingle()
          if (me && p.user_id) {
            supabase.from('notifications').insert({
              user_id: p.user_id, type: 'interest_received',
              message: `${me.full_name || 'Someone'} sent you an interest request`,
              from_profile_id: myProfileId, read: false,
            }).then(() => {})
          }
          setSendingInterest(false)
        }

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && setQuickView(null)}>
            <div className="w-full max-w-sm mx-0 sm:mx-4 sm:mb-0 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'white', maxHeight: '90vh', overflowY: 'auto' }}>

              {/* Photo / avatar header */}
              <div className="relative h-52 shrink-0"
                style={{ background: showPhoto ? undefined : avatarBg(p.full_name) }}>
                {showPhoto ? (
                  <img src={p.photo_url} alt={p.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="28" r="16" fill="#B8AA9E"/>
                      <ellipse cx="40" cy="68" rx="26" ry="18" fill="#B8AA9E"/>
                    </svg>
                    <span className="text-sm font-medium" style={{ color: '#8C7D72' }}>{p.full_name.split(' ')[0]}</span>
                    {p.photo_url && myProfileId && (
                      <button
                        onClick={async () => {
                          if (!myProfileId) return
                          const existing = await supabase.from('field_requests').select('id').eq('from_user', myProfileId).eq('to_user', p.id).maybeSingle()
                          if (!existing.data) {
                            await supabase.from('field_requests').insert({ from_user: myProfileId, to_user: p.id, fields: ['photo'], status: 'pending' })
                          }
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                        📷 Request photo
                      </button>
                    )}
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />

                {/* Close */}
                <button onClick={() => setQuickView(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-white font-bold text-lg leading-tight drop-shadow">{p.full_name}</h2>
                      <p className="text-white/80 text-sm">
                        {age ? `${age} yrs` : ''}{p.height_cm ? ` · ${cmToFeet(p.height_cm)}` : ''}{p.gender ? ` · ${p.gender === 'male' ? 'Groom' : 'Bride'}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isVerified(p) && <span className="badge badge-verified text-xs">✓ Verified</span>}
                      {seenLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                          {seenLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="px-5 py-2 divide-y divide-gray-100">
                {([
                  { svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>, label: `Native: ${p.native_district}${p.current_city ? ` | ${p.current_city}` : ''}` },
                  { svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.75" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>, label: [p.profession, p.education].filter(Boolean).join(' · ') || '—' },
                  { svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.75" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: [p.religion, p.caste].filter(Boolean).join(' · ') || '—' },
                  { svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.75" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: p.family_type ? p.family_type.charAt(0).toUpperCase() + p.family_type.slice(1) + ' family' : '—' },
                  p.about ? { svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.75" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: `${p.about.slice(0, 100)}${p.about.length > 100 ? '…' : ''}` } : null,
                ] as ({ svg: React.ReactNode; label: string } | null)[]).filter(Boolean).map((row, i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5">
                    <span className="shrink-0 mt-0.5">{row!.svg}</span>
                    <p className="text-sm text-gray-600 leading-snug">{row!.label}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-5 pb-6 pt-2 space-y-2.5">
                {myProfileId && myProfileId !== p.id && (
                  <button
                    onClick={handleInterest}
                    disabled={!!status || sendingInterest}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                    style={status
                      ? { background: '#ECFDF5', color: '#065F46' }
                      : { background: '#9B1C1C', color: 'white' }}>
                    {status === 'matched' ? '✓ Matched' :
                     status === 'accepted' ? '✓ Accepted' :
                     status === 'pending' ? '✓ Interest Sent' :
                     status === 'rejected' ? 'Declined' :
                     sendingInterest ? 'Sending…' : '+ Send Interest'}
                  </button>
                )}
                <Link href={`/profile/${p.id}`}
                  className="w-full py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1.5 transition-all"
                  style={{ borderColor: '#E5E7EB', color: '#4B5563' }}
                  onClick={() => setQuickView(null)}>
                  View full profile
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
