'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
const PROFESSIONS = ['Any', 'IT / Software', 'Business', 'Government', 'Healthcare', 'Education', 'Other']

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
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#B45309', '#0369A1', '#047857', '#6D28D9', '#BE185D']
function avatarBg(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }

export default function BrowsePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [gender, setGender] = useState('')
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [profCat, setProfCat] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const availableStates = region ? Object.keys(REGIONS[region] || {}) : []
  const availableDistricts = state ? (REGIONS[region]?.[state] || []) : []

  useEffect(() => { loadProfiles() }, [region, state, district, gender, ageRange, profCat])

  async function loadProfiles() {
    setLoading(true)
    let query = supabase.from('profiles').select('*').eq('status', 'approved')
    if (region) query = query.eq('native_region', region)
    if (state) query = query.eq('native_state', state)
    if (district) query = query.eq('native_district', district)
    if (gender) query = query.eq('gender', gender)
    const { data } = await query.order('created_at', { ascending: false })
    let results = data || []
    if (ageRange) {
      const [minA, maxA] = ageRange === '40+' ? [40, 99] : ageRange.split('–').map(Number)
      results = results.filter(p => { const a = getAge(p.date_of_birth); return a >= minA && a <= maxA })
    }
    if (profCat && profCat !== 'Any') {
      const map: Record<string, string[]> = {
        'IT / Software': ['software', 'engineer', 'developer', 'it ', 'tech'],
        'Business': ['business', 'entrepreneur', 'owner', 'trader'],
        'Government': ['government', 'ias', 'ips', 'civil', 'bank', 'railway'],
        'Healthcare': ['doctor', 'nurse', 'physician', 'medical', 'pharma'],
        'Education': ['teacher', 'professor', 'lecturer', 'faculty'],
      }
      const keywords = map[profCat] || []
      if (keywords.length) results = results.filter(p => keywords.some(k => p.profession?.toLowerCase().includes(k)))
    }
    setProfiles(results)
    setLoading(false)
  }

  const activeFilters = [region, state, district, ageRange, profCat].filter(Boolean).length

  return (
    <div className="min-h-screen" style={{background: '#FFFBF5'}}>

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40" style={{borderColor: '#EDE8E0'}}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="text-base font-bold text-stone-900 font-serif-display shrink-0">
            Natiive<span style={{color: '#B45309'}}>Matrimony</span>
          </Link>

          {/* Inline gender selector */}
          <div className="flex items-center gap-1 text-sm font-medium text-stone-600">
            <span className="hidden sm:inline">Looking for a</span>
            <button onClick={() => setGender(g => g === 'female' ? '' : 'female')}
              className="px-3 py-1 rounded-full border font-semibold transition-all text-xs"
              style={gender === 'female' ? {background: '#B45309', color: 'white', borderColor: '#B45309'} : {borderColor: '#EDE8E0', color: '#78716C'}}>
              Bride
            </button>
            <button onClick={() => setGender(g => g === 'male' ? '' : 'male')}
              className="px-3 py-1 rounded-full border font-semibold transition-all text-xs"
              style={gender === 'male' ? {background: '#B45309', color: 'white', borderColor: '#B45309'} : {borderColor: '#EDE8E0', color: '#78716C'}}>
              Groom
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/interests" className="text-sm text-stone-500 hover:text-amber-700 hidden sm:block">Interests</Link>
            <Link href="/matches" className="text-sm text-stone-500 hover:text-amber-700 hidden sm:block">Matches</Link>
            <Link href="/login" className="text-sm text-stone-500 hover:text-amber-700 hidden sm:block">Login</Link>
            <Link href="/register" className="btn-primary text-xs px-3 py-1.5">Register</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-6">

        {/* Filter bar */}
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-stone-600 shrink-0">Native place:</span>
            <select className="input" style={{width: 'auto', minWidth: '130px'}} value={region} onChange={e => { setRegion(e.target.value); setState(''); setDistrict('') }}>
              <option value="">All Regions</option>
              {Object.keys(REGIONS).map(r => <option key={r}>{r}</option>)}
            </select>
            <select className="input" style={{width: 'auto', minWidth: '110px'}} value={state} onChange={e => { setState(e.target.value); setDistrict('') }} disabled={!region}>
              <option value="">State</option>
              {availableStates.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="input" style={{width: 'auto', minWidth: '130px'}} value={district} onChange={e => setDistrict(e.target.value)} disabled={!state}>
              <option value="">District</option>
              {availableDistricts.map(d => <option key={d}>{d}</option>)}
            </select>

            <button onClick={() => setShowFilters(f => !f)}
              className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5"
              style={{borderColor: activeFilters ? '#B45309' : '#EDE8E0', color: activeFilters ? '#B45309' : '#78716C', background: activeFilters ? '#FEF3C7' : 'white'}}>
              ⚙ More filters {activeFilters > 0 && `(${activeFilters})`}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t flex gap-3 flex-wrap" style={{borderColor: '#EDE8E0'}}>
              <div>
                <p className="section-label mb-1">Age range</p>
                <div className="flex gap-1.5 flex-wrap">
                  {AGE_RANGES.map(a => (
                    <button key={a} onClick={() => setAgeRange(r => r === a ? '' : a)}
                      className="text-xs px-2.5 py-1 rounded-full border font-semibold"
                      style={ageRange === a ? {background: '#B45309', color: 'white', borderColor: '#B45309'} : {borderColor: '#EDE8E0', color: '#78716C'}}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="section-label mb-1">Profession</p>
                <div className="flex gap-1.5 flex-wrap">
                  {PROFESSIONS.map(p => (
                    <button key={p} onClick={() => setProfCat(c => c === p ? '' : p)}
                      className="text-xs px-2.5 py-1 rounded-full border font-semibold"
                      style={profCat === p ? {background: '#B45309', color: 'white', borderColor: '#B45309'} : {borderColor: '#EDE8E0', color: '#78716C'}}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setRegion(''); setState(''); setDistrict(''); setGender(''); setAgeRange(''); setProfCat('') }}
                className="text-xs text-stone-400 hover:text-red-500 self-end ml-auto">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results meta */}
        <div className="flex items-center gap-3 mb-4">
          <p className="text-sm text-stone-500">
            {loading ? 'Loading...' : `${profiles.length} profile${profiles.length !== 1 ? 's' : ''} found`}
          </p>
          <div className="flex-1 border-t" style={{borderColor: '#EDE8E0'}} />
          <span className="text-xs text-stone-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{background: '#059669'}} /> All manually verified
          </span>
        </div>

        {/* Empty */}
        {!loading && profiles.length === 0 && (
          <div className="card p-16 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-semibold text-stone-700">No profiles found</p>
            <p className="text-sm text-stone-400 mt-1">Try a broader region or remove some filters</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => (
            <Link href={`/profile/${p.id}`} key={p.id}>
              <div className="card card-hover overflow-hidden cursor-pointer">
                {/* Avatar area */}
                <div className="h-32 flex items-center justify-center relative" style={{background: 'linear-gradient(135deg, #FEF3C7, #FFFBF5)'}}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{background: avatarBg(p.full_name)}}>
                    {initials(p.full_name)}
                  </div>
                  <div className="absolute top-3 right-3">
                    {p.verified
                      ? <span className="badge badge-verified text-xs">✓ Verified</span>
                      : null}
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <span className="text-xs text-stone-400 bg-white bg-opacity-80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Photo after match
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-stone-900 text-base">{p.full_name}</h3>
                  <p className="text-sm text-stone-500 mt-0.5">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                  <div className="mt-3 pt-3 border-t space-y-1" style={{borderColor: '#F0EBE3'}}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-400">Native</span>
                      <span className="font-semibold px-2 py-0.5 rounded-full" style={{background: '#FEF3C7', color: '#92400E'}}>
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
