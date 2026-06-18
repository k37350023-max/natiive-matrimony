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
  native_region: string
  current_city: string
  verified: boolean
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#B45309', '#0369A1', '#047857', '#6D28D9', '#BE185D', '#C2410C', '#0891B2']
function avatarBg(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }

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
    <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E8E0D6' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="text-base font-bold text-stone-900 font-serif-display shrink-0">
          Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/interests" className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Interests</Link>
          <Link href="/matches" className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Matches</Link>
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
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#059669' }} />
                All verified
              </div>
            </div>

            {/* Empty state */}
            {!loading && profiles.length === 0 && (
              <div className="card p-12 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF9EC' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.75">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <p className="font-semibold text-stone-700 mb-1">No profiles found</p>
                <p className="text-sm text-stone-400">
                  {activeFilterCount > 0 ? 'Try broadening your filters' : 'Be the first from your region — register your profile!'}
                </p>
                {activeFilterCount > 0
                  ? <button onClick={clearAll} className="btn-ghost px-5 py-2 text-sm mt-4">Clear filters</button>
                  : <Link href="/register" className="btn-primary px-5 py-2 text-sm mt-4 inline-flex">Register Free</Link>
                }
              </div>
            )}

            {/* Profile list */}
            <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-3">
              {profiles.map(p => (
                <Link href={`/profile/${p.id}`} key={p.id} className="block">
                  <div className="card card-hover cursor-pointer active:scale-[0.99] transition-all">
                    {/* Mobile: horizontal layout */}
                    <div className="sm:hidden flex items-center gap-3.5 p-3.5">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: avatarBg(p.full_name) }}>
                        {initials(p.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-stone-900 text-sm truncate">{p.full_name}</h3>
                          {p.verified && <span className="badge badge-verified shrink-0">✓</span>}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                            style={{ background: '#FEF9EC', color: '#92400E' }}>
                            {p.native_district}
                          </span>
                          <span className="text-xs text-stone-400">{p.current_city}</span>
                        </div>
                      </div>
                      <svg className="text-stone-300 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </div>

                    {/* Desktop: vertical card */}
                    <div className="hidden sm:block overflow-hidden">
                      <div className="h-24 flex items-center justify-center relative"
                        style={{ background: 'linear-gradient(135deg, #FEF9EC, #FFF7F0)' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold"
                          style={{ background: avatarBg(p.full_name) }}>
                          {initials(p.full_name)}
                        </div>
                        {p.verified && (
                          <div className="absolute top-2 right-2">
                            <span className="badge badge-verified">✓ Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <h3 className="font-semibold text-stone-900 text-sm">{p.full_name}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                        <div className="mt-2.5 pt-2.5 border-t flex items-center justify-between" style={{ borderColor: '#F0EBE3' }}>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md"
                            style={{ background: '#FEF9EC', color: '#92400E' }}>
                            {p.native_district}
                          </span>
                          <span className="text-xs text-stone-400">{p.current_city}</span>
                        </div>
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
