'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import IndiaMap from '../components/IndiaMap'

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

  // Check session on mount
  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    if (!myId) { setSessionChecked(true); return }
    supabase.from('profiles').select('gender').eq('id', myId).single()
      .then(({ data }) => {
        setMyGender(data?.gender ?? null)
        setSessionChecked(true)
      })
  }, [])

  useEffect(() => {
    if (sessionChecked && oppositeGender) loadProfiles()
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

  function handleMapRegion(r: string) {
    setRegion(r)
    setState('')
    setDistrict('')
  }

  const header = (
    <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#EDE8E0' }}>
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="text-base font-bold text-stone-900 font-serif-display shrink-0">
          Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/interests" className="text-sm text-stone-500 hover:text-amber-700 hidden sm:block">Interests</Link>
          <Link href="/matches" className="text-sm text-stone-500 hover:text-amber-700 hidden sm:block">Matches</Link>
          {sessionChecked && !myGender
            ? <Link href="/login" className="btn-primary text-xs px-3 py-1.5">Login</Link>
            : null}
        </div>
      </div>
    </header>
  )

  // Loading skeleton
  if (!sessionChecked) return (
    <div className="min-h-screen" style={{ background: '#FFFBF5' }}>{header}
      <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
    </div>
  )

  // Login wall
  if (!myGender) return (
    <div className="min-h-screen" style={{ background: '#FFFBF5' }}>{header}
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <div className="mb-6">
          <IndiaMap mode="animated" />
        </div>
        <h2 className="font-serif-display text-2xl font-bold text-stone-900 mb-3">
          Register to browse profiles
        </h2>
        <p className="text-stone-500 mb-8 leading-relaxed max-w-sm mx-auto">
          We show you compatible matches from your native region — based on your profile.
          Register free to start browsing.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary px-8 py-3">Register Free</Link>
          <Link href="/login" className="btn-outline px-8 py-3">I have an account</Link>
        </div>
      </div>
    </div>
  )

  const activeFilterCount = [region, state, district, ageRange, profCat].filter(Boolean).length

  return (
    <div className="min-h-screen" style={{ background: '#FFFBF5' }}>{header}
      <div className="max-w-6xl mx-auto px-5 py-6">

        {/* Map + filter row */}
        <div className="card p-5 mb-5">
          <div className="flex flex-col sm:flex-row gap-6 items-start">

            {/* Mini map — desktop */}
            <div className="hidden sm:block shrink-0">
              <p className="section-label mb-2">Filter by native region</p>
              <IndiaMap mode="filter" selectedRegion={region} onRegionClick={handleMapRegion} compact />
            </div>

            {/* Mobile chips */}
            <div className="sm:hidden w-full">
              <p className="section-label mb-2">Native region</p>
              <div className="flex gap-2 flex-wrap">
                {['Coastal Andhra', 'Rayalaseema', 'Telangana'].map(r => (
                  <button key={r}
                    onClick={() => handleMapRegion(region === r ? '' : r)}
                    className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-all"
                    style={region === r
                      ? { background: '#FEF3C7', color: '#92400E', borderColor: '#B45309' }
                      : { borderColor: '#EDE8E0', color: '#78716C', background: 'white' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdowns */}
            <div className="flex-1 w-full">
              <p className="section-label mb-2">Narrow down</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select className="input" value={state}
                  onChange={e => { setState(e.target.value); setDistrict('') }}
                  disabled={!region}>
                  <option value="">State</option>
                  {availableStates.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="input" value={district}
                  onChange={e => setDistrict(e.target.value)}
                  disabled={!state}>
                  <option value="">District</option>
                  {availableDistricts.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>

              <button
                onClick={() => setShowMoreFilters(f => !f)}
                className="text-xs font-semibold flex items-center gap-1 mt-1"
                style={{ color: activeFilterCount > 0 ? '#B45309' : '#78716C' }}>
                ⚙ {showMoreFilters ? 'Hide' : 'More'} filters
                {activeFilterCount > 0 && ` (${activeFilterCount} active)`}
              </button>

              {showMoreFilters && (
                <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: '#EDE8E0' }}>
                  <div>
                    <p className="section-label mb-1.5">Age range</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {AGE_RANGES.map(a => (
                        <button key={a} onClick={() => setAgeRange(r => r === a ? '' : a)}
                          className="text-xs px-2.5 py-1 rounded-full border font-semibold"
                          style={ageRange === a
                            ? { background: '#B45309', color: 'white', borderColor: '#B45309' }
                            : { borderColor: '#EDE8E0', color: '#78716C' }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="section-label mb-1.5">Profession</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {PROFESSIONS.map(p => (
                        <button key={p} onClick={() => setProfCat(c => c === p ? '' : p)}
                          className="text-xs px-2.5 py-1 rounded-full border font-semibold"
                          style={profCat === p
                            ? { background: '#B45309', color: 'white', borderColor: '#B45309' }
                            : { borderColor: '#EDE8E0', color: '#78716C' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setRegion(''); setState(''); setDistrict(''); setAgeRange(''); setProfCat('') }}
                    className="text-xs text-stone-400 hover:text-red-500">
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results meta */}
        <div className="flex items-center gap-3 mb-4">
          <p className="text-sm text-stone-500">
            {loading ? 'Loading...' : `${profiles.length} ${oppositeGender === 'female' ? 'bride' : 'groom'}${profiles.length !== 1 ? 's' : ''} found`}
          </p>
          <div className="flex-1 border-t" style={{ borderColor: '#EDE8E0' }} />
          <span className="text-xs text-stone-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: '#059669', display: 'inline-block' }} /> All manually verified
          </span>
        </div>

        {/* Empty */}
        {!loading && profiles.length === 0 && (
          <div className="card p-16 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-semibold text-stone-700">No profiles found</p>
            <p className="text-sm text-stone-400 mt-1">Try a broader region or clear some filters</p>
          </div>
        )}

        {/* Profile grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => (
            <Link href={`/profile/${p.id}`} key={p.id}>
              <div className="card card-hover overflow-hidden cursor-pointer">
                <div className="h-32 flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, #FEF3C7, #FFFBF5)' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ background: avatarBg(p.full_name) }}>
                    {initials(p.full_name)}
                  </div>
                  {p.verified && (
                    <div className="absolute top-3 right-3">
                      <span className="badge badge-verified">✓ Verified</span>
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
                <div className="p-4">
                  <h3 className="font-bold text-stone-900">{p.full_name}</h3>
                  <p className="text-sm text-stone-500 mt-0.5">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                  <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: '#F0EBE3' }}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-400">Native</span>
                      <span className="font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                        {p.native_district}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-400">City</span>
                      <span className="font-medium text-stone-600">{p.current_city}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
