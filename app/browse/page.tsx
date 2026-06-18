'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import IndiaMap from '../components/IndiaMap'
import MobileNav from '../components/MobileNav'
import LaunchBanner from '../components/LaunchBanner'

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
  native_district: string
  native_state: string
  current_city: string
  verified: boolean
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = ['#B45309', '#0369A1', '#047857', '#6D28D9', '#BE185D']
function avatarBg(name: string) { return COLORS[name.charCodeAt(0) % COLORS.length] }

export default function BrowsePage() {
  const [sessionChecked, setSessionChecked] = useState(false)
  const [myGender, setMyGender] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [profCat, setProfCat] = useState('')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  const availableStates = region ? Object.keys(REGIONS[region] || {}) : []
  const availableDistricts = state ? (REGIONS[region]?.[state] || []) : []
  const oppositeGender = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : null

  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    if (!myId) { setSessionChecked(true); return }
    supabase.from('profiles').select('gender').eq('id', myId).single()
      .then(({ data }) => { setMyGender(data?.gender ?? null); setSessionChecked(true) })
  }, [])

  useEffect(() => {
    if (sessionChecked) loadProfiles()
  }, [sessionChecked, oppositeGender, region, state, district, ageRange, profCat])

  async function loadProfiles() {
    setLoading(true)
    let query = supabase.from('profiles').select('*').eq('status', 'approved')
    if (oppositeGender) query = query.eq('gender', oppositeGender)
    if (region) query = query.eq('native_region', region)
    if (state) query = query.eq('native_state', state)
    if (district) query = query.eq('native_district', district)
    const { data } = await query.order('created_at', { ascending: false })
    let results = data || []
    if (ageRange) {
      const [minA, maxA] = ageRange === '40+' ? [40, 99] : ageRange.split('–').map(Number)
      results = results.filter(p => { const a = getAge(p.date_of_birth); return a >= minA && a <= maxA })
    }
    if (profCat) {
      const kws = PROF_KEYWORDS[profCat] || []
      if (kws.length) results = results.filter(p => kws.some(k => p.profession?.toLowerCase().includes(k)))
    }
    setProfiles(results)
    setLoading(false)
  }

  function handleMapRegion(r: string) { setRegion(r); setState(''); setDistrict('') }
  function clearAll() { setRegion(''); setState(''); setDistrict(''); setAgeRange(''); setProfCat('') }

  const activeFilterCount = [region, state, district, ageRange, profCat].filter(Boolean).length

  const header = (
    <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#EDE8E0' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="text-base font-bold text-stone-900 font-serif-display shrink-0">
          Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/interests" className="text-sm text-stone-500 hover:text-amber-700 hidden sm:block">Interests</Link>
          <Link href="/matches" className="text-sm text-stone-500 hover:text-amber-700 hidden sm:block">Matches</Link>
          {sessionChecked && !myGender && (
            <>
              <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-amber-700 hidden sm:block">Login</Link>
              <Link href="/register" className="btn-primary text-xs px-3 py-1.5">Register Free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )

  if (!sessionChecked) return (
    <div className="min-h-screen" style={{ background: '#FFFBF5' }}>{header}
      <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
    </div>
  )

  const genderLabel = oppositeGender === 'female' ? 'bride' : oppositeGender === 'male' ? 'groom' : 'profile'
  const genderLabelPlural = oppositeGender === 'female' ? 'brides' : oppositeGender === 'male' ? 'grooms' : 'profiles'

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#FFFBF5' }}>
      {header}
      <LaunchBanner />

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">

        {/* Guest register nudge — only for non-logged-in */}
        {!myGender && (
          <div className="rounded-xl border-2 p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{ background: '#FFFBF5', borderColor: '#FDE68A' }}>
            <div>
              <p className="font-bold text-stone-800 text-sm">Register to see your best matches</p>
              <p className="text-xs text-stone-500 mt-0.5">We filter by your native region and show compatible profiles. Free — no card needed.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/login" className="btn-outline text-xs px-4 py-2">Login</Link>
              <Link href="/register" className="btn-primary text-xs px-4 py-2">Register Free →</Link>
            </div>
          </div>
        )}

        {/* Filter panel */}
        <div className="card p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">

            {/* Desktop: accurate India map */}
            <div className="hidden sm:block shrink-0">
              <p className="section-label mb-2">Filter by native region</p>
              <IndiaMap mode="filter" selectedRegion={region} onRegionClick={handleMapRegion} compact />
            </div>

            {/* Right side: all filter controls */}
            <div className="flex-1 w-full min-w-0">

              {/* Region chips */}
              <p className="section-label mb-2">Native region</p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {['Telangana', 'Coastal Andhra', 'Rayalaseema'].map(r => (
                  <button key={r}
                    onClick={() => handleMapRegion(region === r ? '' : r)}
                    className="text-xs px-3.5 py-2 rounded-full border font-semibold shrink-0 transition-all"
                    style={region === r
                      ? { background: '#FEF3C7', color: '#92400E', borderColor: '#B45309' }
                      : { borderColor: '#EDE8E0', color: '#78716C', background: 'white' }}>
                    {r}
                  </button>
                ))}
              </div>

              {/* State + District */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <select className="input text-sm" value={state}
                  onChange={e => { setState(e.target.value); setDistrict('') }}
                  disabled={!region}>
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

              {/* More filters toggle */}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => setShowMoreFilters(f => !f)}
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: activeFilterCount > 0 ? '#B45309' : '#78716C' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  {showMoreFilters ? 'Hide filters' : 'More filters'}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 text-white text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: '#B45309' }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {activeFilterCount > 0 && (
                  <button onClick={clearAll} className="text-xs text-stone-400 hover:text-red-500 font-medium">
                    Clear all
                  </button>
                )}
              </div>

              {showMoreFilters && (
                <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: '#EDE8E0' }}>
                  <div>
                    <p className="section-label mb-2">Age range</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {AGE_RANGES.map(a => (
                        <button key={a} onClick={() => setAgeRange(r => r === a ? '' : a)}
                          className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-all"
                          style={ageRange === a
                            ? { background: '#B45309', color: 'white', borderColor: '#B45309' }
                            : { borderColor: '#EDE8E0', color: '#78716C', background: 'white' }}>
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
                          className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-all"
                          style={profCat === p
                            ? { background: '#B45309', color: 'white', borderColor: '#B45309' }
                            : { borderColor: '#EDE8E0', color: '#78716C', background: 'white' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results meta */}
        <div className="flex items-center gap-3 mb-4">
          <p className="text-sm text-stone-500 font-medium">
            {loading ? 'Loading...' : `${profiles.length} ${profiles.length !== 1 ? genderLabelPlural : genderLabel} found`}
          </p>
          <div className="flex-1 border-t" style={{ borderColor: '#EDE8E0' }} />
          <span className="text-xs text-stone-400 flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#059669' }} />
            All verified
          </span>
        </div>

        {/* Empty */}
        {!loading && profiles.length === 0 && (
          <div className="card p-16 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-semibold text-stone-700">No profiles found</p>
            <p className="text-sm text-stone-400 mt-1">
              {activeFilterCount > 0 ? 'Try a broader region or clear some filters' : 'Be the first from your region — register your profile!'}
            </p>
            {activeFilterCount > 0
              ? <button onClick={clearAll} className="btn-outline px-5 py-2 text-sm mt-4">Clear all filters</button>
              : <Link href="/register" className="btn-primary px-5 py-2 text-sm mt-4 inline-flex">Register Free →</Link>
            }
          </div>
        )}

        {/* Profile grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {profiles.map(p => (
            <Link href={`/profile/${p.id}`} key={p.id}>
              <div className="card card-hover overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
                {/* Avatar area */}
                <div className="h-28 flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, #FEF3C7, #FFFBF5)' }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ background: avatarBg(p.full_name) }}>
                    {initials(p.full_name)}
                  </div>
                  {p.verified && (
                    <div className="absolute top-2 right-2">
                      <span className="badge badge-verified text-xs">✓ Verified</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <span className="text-xs text-stone-400 bg-white bg-opacity-80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Photo after match
                    </span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-3.5">
                  <h3 className="font-bold text-stone-900 text-sm">{p.full_name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                  <div className="mt-2.5 pt-2.5 border-t flex items-center justify-between" style={{ borderColor: '#F0EBE3' }}>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                      📍 {p.native_district}
                    </span>
                    <span className="text-xs text-stone-400">{p.current_city}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <MobileNav />
    </div>
  )
}
