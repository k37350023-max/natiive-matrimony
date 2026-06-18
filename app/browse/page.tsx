'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import IndiaMap from '../components/IndiaMap'
import MobileNav from '../components/MobileNav'
import LaunchBanner from '../components/LaunchBanner'
import NotificationBell from '../components/NotificationBell'

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

const AVATAR_COLORS = ['#B45309', '#0369A1', '#047857', '#6D28D9', '#BE185D', '#C2410C', '#0891B2']
function avatarBg(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }

const INTEREST_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  matched:  { label: 'Matched ✓',      bg: '#ECFDF5', color: '#065F46' },
  accepted: { label: 'Accepted ✓',     bg: '#ECFDF5', color: '#065F46' },
  pending:  { label: 'Interest Sent',  bg: '#FEF9EC', color: '#92400E' },
  rejected: { label: 'Declined',       bg: '#FEF2F2', color: '#991B1B' },
}

export default function BrowsePage() {
  const [sessionChecked, setSessionChecked] = useState(false)
  const [myGender, setMyGender] = useState<string | null>(null)
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [profCat, setProfCat] = useState('')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [alertSet, setAlertSet] = useState(false)
  const [interestMap, setInterestMap] = useState<Record<string, string>>({})

  const availableStates = region ? Object.keys(REGIONS[region] || {}) : []
  const availableDistricts = state ? (REGIONS[region]?.[state] || []) : []
  const oppositeGender = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : null

  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    setMyProfileId(myId)
    if (!myId) { setSessionChecked(true); return }
    Promise.all([
      supabase.from('profiles').select('gender').eq('id', myId).single(),
      supabase.from('interests').select('to_user, status').eq('from_user', myId),
      supabase.from('matches').select('user1, user2').or(`user1.eq.${myId},user2.eq.${myId}`),
    ]).then(([{ data: profile }, { data: interests }, { data: matches }]) => {
      setMyGender(profile?.gender ?? null)
      const map: Record<string, string> = {}
      interests?.forEach(i => { map[i.to_user] = i.status })
      matches?.forEach(m => {
        const other = m.user1 === myId ? m.user2 : m.user1
        map[other] = 'matched'
      })
      setInterestMap(map)
      setSessionChecked(true)
    })
  }, [])

  useEffect(() => {
    if (sessionChecked) loadProfiles()
  }, [sessionChecked, oppositeGender, region, state, district, ageRange, profCat, myProfileId])

  async function loadProfiles() {
    setLoading(true)

    function buildBase() {
      let q = supabase.from('profiles').select('*').eq('status', 'approved')
      if (oppositeGender) q = q.eq('gender', oppositeGender)
      if (region) q = q.eq('native_region', region)
      if (state) q = q.eq('native_state', state)
      if (district) q = q.eq('native_district', district)
      return q
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    let orClause = `last_login_at.gt.${fourteenDaysAgo},last_login_at.is.null`
    if (myProfileId) orClause += `,id.eq.${myProfileId}`

    let { data, error } = await buildBase().or(orClause).order('created_at', { ascending: false })
    if (error) {
      // Column doesn't exist yet — fall back to unfiltered
      const result = await buildBase().order('created_at', { ascending: false })
      data = result.data
    }

    let results = data || []
    if (ageRange) {
      const [minA, maxA] = ageRange === '40+' ? [40, 99] : ageRange.split('–').map(Number)
      results = results.filter(p => { const a = getAge(p.date_of_birth); return a != null && a >= minA && a <= maxA })
    }
    if (profCat) {
      const kws = PROF_KEYWORDS[profCat] || []
      if (kws.length) results = results.filter(p => kws.some(k => p.profession?.toLowerCase().includes(k)))
    }
    setProfiles(results)
    setLoading(false)
  }

  function handleMapRegion(r: string) { setRegion(r); setState(''); setDistrict(''); setAlertSet(false) }
  function clearAll() { setRegion(''); setState(''); setDistrict(''); setAgeRange(''); setProfCat(''); setAlertSet(false) }

  function handleSetAlert() {
    const key = district || state || region
    if (!key) return
    const existing: string[] = JSON.parse(localStorage.getItem('region_alerts') || '[]')
    if (!existing.includes(key)) {
      localStorage.setItem('region_alerts', JSON.stringify([...existing, key]))
    }
    setAlertSet(true)
  }

  useEffect(() => {
    const key = district || state || region
    if (!key) { setAlertSet(false); return }
    const existing: string[] = JSON.parse(localStorage.getItem('region_alerts') || '[]')
    setAlertSet(existing.includes(key))
  }, [region, state, district])

  const activeFilterCount = [region, state, district, ageRange, profCat].filter(Boolean).length

  const header = (
    <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E8E0D6' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="text-base font-bold text-stone-900 font-serif-display shrink-0">
          Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/interests" className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Interests</Link>
          <Link href="/matches" className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Matches</Link>
          <NotificationBell />
          {sessionChecked && myProfileId && (
            <Link href={`/profile/${myProfileId}`}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold shrink-0"
              style={{ background: '#B45309' }}
              title="My Profile">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          )}
          {sessionChecked && !myGender && (
            <>
              <Link href="/login" className="text-sm font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Login</Link>
              <Link href="/register" className="btn-primary text-xs px-3 py-1.5">Register Free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )

  if (!sessionChecked) return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>{header}
      <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
    </div>
  )

  // Gate: must have a created profile to browse
  if (!myProfileId) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6" style={{ background: '#FAFAF9' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ background: '#FEF9EC' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-stone-900 font-serif-display mb-2">Create your profile first</h2>
        <p className="text-stone-500 text-sm max-w-xs">You need a complete profile before you can browse and connect with matches.</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/register" className="btn-primary py-3 text-center text-sm">Create Profile</Link>
        <Link href="/login" className="btn-ghost py-3 text-center text-sm">Sign in</Link>
      </div>
    </div>
  )

  const genderLabelPlural = oppositeGender === 'female' ? 'brides' : oppositeGender === 'male' ? 'grooms' : 'profiles'

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#FAFAF9' }}>
      {header}
      <LaunchBanner />

      <div className="max-w-6xl mx-auto px-4 py-5">

        {/* Guest nudge — slim, non-intrusive */}
        {!myGender && (
          <div className="rounded-lg border px-4 py-3 mb-4 flex items-center justify-between gap-4"
            style={{ background: 'white', borderColor: '#E8E0D6' }}>
            <p className="text-sm text-stone-600">
              <span className="font-semibold text-stone-800">Register for better matches.</span>{' '}
              We filter by your native region and show compatible profiles.
            </p>
            <div className="flex gap-2 shrink-0">
              <Link href="/login" className="btn-ghost text-xs px-3 py-1.5">Login</Link>
              <Link href="/register" className="btn-primary text-xs px-3 py-1.5">Register Free</Link>
            </div>
          </div>
        )}

        <div className="flex gap-5">

          {/* Desktop sidebar: map + filters */}
          <aside className="hidden sm:flex flex-col gap-4 w-56 shrink-0">
            <div className="card p-4">
              <p className="section-label mb-3">Filter by region</p>
              <IndiaMap mode="filter" selectedRegion={region} onRegionClick={handleMapRegion} compact />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Telangana', 'Coastal Andhra', 'Rayalaseema'].map(r => (
                  <button key={r}
                    onClick={() => handleMapRegion(region === r ? '' : r)}
                    className="text-xs px-2.5 py-1 rounded-md border font-medium transition-all"
                    style={region === r
                      ? { background: '#FEF9EC', color: '#B45309', borderColor: '#E8C99A' }
                      : { borderColor: '#E8E0D6', color: '#78716C', background: 'white' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {region && (
              <div className="card p-4 space-y-3">
                <select className="input text-sm" value={state}
                  onChange={e => { setState(e.target.value); setDistrict('') }}>
                  <option value="">All states</option>
                  {availableStates.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="input text-sm" value={district}
                  onChange={e => setDistrict(e.target.value)}
                  disabled={!state}>
                  <option value="">All districts</option>
                  {availableDistricts.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            )}

            <div className="card p-4">
              <p className="section-label mb-3">Age range</p>
              <div className="flex flex-wrap gap-1.5">
                {AGE_RANGES.map(a => (
                  <button key={a} onClick={() => setAgeRange(r => r === a ? '' : a)}
                    className="text-xs px-2.5 py-1 rounded-md border font-medium transition-all"
                    style={ageRange === a
                      ? { background: '#B45309', color: 'white', borderColor: '#B45309' }
                      : { borderColor: '#E8E0D6', color: '#78716C', background: 'white' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <p className="section-label mb-3">Profession</p>
              <div className="flex flex-wrap gap-1.5">
                {PROFESSIONS.map(p => (
                  <button key={p} onClick={() => setProfCat(c => c === p ? '' : p)}
                    className="text-xs px-2.5 py-1 rounded-md border font-medium transition-all"
                    style={profCat === p
                      ? { background: '#B45309', color: 'white', borderColor: '#B45309' }
                      : { borderColor: '#E8E0D6', color: '#78716C', background: 'white' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs text-stone-400 hover:text-red-500 font-medium text-left">
                Clear all filters ({activeFilterCount})
              </button>
            )}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Mobile filter bar */}
            <div className="sm:hidden mb-4">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {['Telangana', 'Coastal Andhra', 'Rayalaseema'].map(r => (
                  <button key={r}
                    onClick={() => handleMapRegion(region === r ? '' : r)}
                    className="text-xs px-3 py-2 rounded-lg border font-semibold shrink-0 transition-all"
                    style={region === r
                      ? { background: '#FEF9EC', color: '#B45309', borderColor: '#E8C99A' }
                      : { borderColor: '#E8E0D6', color: '#78716C', background: 'white' }}>
                    {r}
                  </button>
                ))}
                <button
                  onClick={() => setShowMoreFilters(f => !f)}
                  className="text-xs px-3 py-2 rounded-lg border font-semibold shrink-0 flex items-center gap-1.5"
                  style={activeFilterCount > 0
                    ? { background: '#FEF9EC', color: '#B45309', borderColor: '#E8C99A' }
                    : { borderColor: '#E8E0D6', color: '#78716C', background: 'white' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
              </div>

              {showMoreFilters && (
                <div className="card p-4 mt-3 space-y-4">
                  {region && (
                    <div className="grid grid-cols-2 gap-2">
                      <select className="input text-sm" value={state}
                        onChange={e => { setState(e.target.value); setDistrict('') }}>
                        <option value="">State</option>
                        {availableStates.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <select className="input text-sm" value={district}
                        onChange={e => setDistrict(e.target.value)}
                        disabled={!state}>
                        <option value="">District</option>
                        {availableDistricts.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <p className="section-label mb-2">Age</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {AGE_RANGES.map(a => (
                        <button key={a} onClick={() => setAgeRange(r => r === a ? '' : a)}
                          className="text-xs px-2.5 py-1.5 rounded-md border font-medium"
                          style={ageRange === a
                            ? { background: '#B45309', color: 'white', borderColor: '#B45309' }
                            : { borderColor: '#E8E0D6', color: '#78716C', background: 'white' }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="section-label mb-2">Profession</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {PROFESSIONS.map(p => (
                        <button key={p} onClick={() => setProfCat(c => c === p ? '' : p)}
                          className="text-xs px-2.5 py-1.5 rounded-md border font-medium"
                          style={profCat === p
                            ? { background: '#B45309', color: 'white', borderColor: '#B45309' }
                            : { borderColor: '#E8E0D6', color: '#78716C', background: 'white' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-stone-400 hover:text-red-500 font-medium">Clear all</button>
                  )}
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-stone-500">
                {loading ? 'Loading...' : (
                  <><span className="font-semibold text-stone-800">{profiles.length}</span> {genderLabelPlural} found</>
                )}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#B45309' }} />
                ✓ Verified profiles marked
              </div>
            </div>

            {/* Empty state */}
            {!loading && profiles.length === 0 && (
              <div className="card p-8 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF9EC' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                {(region || state || district) ? (
                  <>
                    <p className="font-semibold text-stone-800 mb-1">
                      No {genderLabelPlural} from {district || state || region} yet
                    </p>
                    <p className="text-sm text-stone-500 mb-5 leading-relaxed max-w-xs mx-auto">
                      Be the first from your area, or invite friends and family to join.
                      {myProfileId ? ' We\'ll alert you when someone from here registers.' : ''}
                    </p>
                    <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
                      {myProfileId ? (
                        <button
                          onClick={handleSetAlert}
                          disabled={alertSet}
                          className={alertSet ? 'btn-ghost px-5 py-2.5 text-sm' : 'btn-primary px-5 py-2.5 text-sm'}>
                          {alertSet ? `✓ Alert set for ${district || state || region}` : 'Notify me when someone joins'}
                        </button>
                      ) : (
                        <Link href="/register" className="btn-primary px-5 py-2.5 text-sm">
                          Create Your Profile
                        </Link>
                      )}
                      <button onClick={clearAll} className="btn-ghost px-5 py-2.5 text-sm text-stone-400">
                        Show all {genderLabelPlural}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-stone-700 mb-1">No profiles found</p>
                    <p className="text-sm text-stone-400 mb-4">Be the first from your region — register your profile!</p>
                    <Link href="/register" className="btn-primary px-5 py-2 text-sm inline-flex">Register Free</Link>
                  </>
                )}
              </div>
            )}

            {/* Profile grid — photo-first, 2 cols mobile / 3 cols desktop */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {profiles.map(p => (
                <Link href={`/profile/${p.id}`} key={p.id} className="block group">
                  <div className="rounded-2xl overflow-hidden shadow-sm border active:scale-[0.98] transition-transform"
                    style={{ borderColor: '#E8E0D6', background: 'white' }}>

                    {/* Photo — 4:5 portrait ratio */}
                    <div className="relative" style={{ paddingBottom: '125%' }}>
                      {p.photo_url && p.photo_visibility === 'public' ? (
                        <img src={p.photo_url} alt={p.full_name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                          style={{ background: `linear-gradient(135deg, ${avatarBg(p.full_name)}cc, ${avatarBg(p.full_name)})` }}>
                          <span className="text-white text-3xl font-bold">{initials(p.full_name)}</span>
                          <span className="text-white/60 text-xs">No photo yet</span>
                        </div>
                      )}

                      {/* Gradient overlay for readability */}
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 40%, transparent 65%)' }} />

                      {/* Top-left: verified badge */}
                      {isVerified(p) && (
                        <div className="absolute top-2 left-2">
                          <span className="badge badge-verified text-xs shadow-sm">✓ Verified</span>
                        </div>
                      )}

                      {/* Top-right: interest status dot */}
                      {interestMap[p.id] && (
                        <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-white shadow"
                          style={{ background: interestMap[p.id] === 'rejected' ? '#EF4444' : '#059669' }}>
                          {interestMap[p.id] === 'rejected'
                            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </div>
                      )}

                      {/* Bottom overlay: name + age */}
                      <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-6">
                        <p className="text-white font-bold text-sm leading-tight drop-shadow">{p.full_name}</p>
                        {getAge(p.date_of_birth) != null && (
                          <p className="text-white/80 text-xs mt-0.5">{getAge(p.date_of_birth)} yrs</p>
                        )}
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-3 py-2.5">
                      <p className="text-xs font-medium text-stone-700 truncate">{p.profession}</p>
                      <div className="flex items-center justify-between mt-1.5 gap-1">
                        <span className="text-xs text-stone-400 truncate flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                          {p.native_district}
                        </span>
                        {isSerious(p) ? (
                          <span className="relative group/tip cursor-default shrink-0 text-xs px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                            ★
                            <span className="absolute bottom-full right-0 mb-1.5 w-48 px-2.5 py-2 rounded-lg text-xs text-white opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-50 leading-relaxed font-normal text-left"
                              style={{ background: '#1C1917' }}>
                              <span className="font-semibold block mb-0.5">Serious Seeker</span>
                              Has photo, education, about, height &amp; caste filled — a genuine, complete profile.
                              <span className="absolute top-full right-3 border-4 border-transparent" style={{ borderTopColor: '#1C1917' }} />
                            </span>
                          </span>
                        ) : interestMap[p.id] ? (
                          <span className="text-xs px-1.5 py-0.5 rounded font-semibold shrink-0"
                            style={{ background: INTEREST_STATUS[interestMap[p.id]]?.bg, color: INTEREST_STATUS[interestMap[p.id]]?.color }}>
                            {INTEREST_STATUS[interestMap[p.id]]?.label}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  )
}
