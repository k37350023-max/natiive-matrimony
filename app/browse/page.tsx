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

const avatarColors = ['#C2410C', '#0369A1', '#047857', '#7C3AED', '#B45309']
function avatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length]
}

export default function BrowsePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [gender, setGender] = useState('')

  const availableStates = region ? Object.keys(REGIONS[region] || {}) : []
  const availableDistricts = state ? (REGIONS[region]?.[state] || []) : []

  useEffect(() => { loadProfiles() }, [region, state, district, gender])

  async function loadProfiles() {
    setLoading(true)
    let query = supabase.from('profiles').select('*').eq('status', 'approved')
    if (region) query = query.eq('native_region', region)
    if (state) query = query.eq('native_state', state)
    if (district) query = query.eq('native_district', district)
    if (gender) query = query.eq('gender', gender)
    const { data } = await query.order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{background: '#FFF7ED'}}>
      {/* Header */}
      <header style={{background: 'white', borderBottom: '1px solid #E7E5E4'}}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-bold text-stone-900 tracking-tight">
            Natiive<span className="text-orange-700">Matrimony</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/interests" className="text-sm font-medium text-stone-600 hover:text-orange-700 whitespace-nowrap">Interests</Link>
            <Link href="/matches" className="text-sm font-medium text-stone-600 hover:text-orange-700 whitespace-nowrap">Matches</Link>
            <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-orange-700 whitespace-nowrap">Login</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2 whitespace-nowrap">Register</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Browse Profiles</h1>
          <p className="text-stone-500 text-sm mt-1">Filter by native place to find the right match</p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="section-label block mb-1">Region</label>
              <select className="input" value={region} onChange={e => { setRegion(e.target.value); setState(''); setDistrict('') }}>
                <option value="">All Regions</option>
                {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1">State</label>
              <select className="input" value={state} onChange={e => { setState(e.target.value); setDistrict('') }} disabled={!region}>
                <option value="">All States</option>
                {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1">District</label>
              <select className="input" value={district} onChange={e => setDistrict(e.target.value)} disabled={!state}>
                <option value="">All Districts</option>
                {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1">Looking for</label>
              <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Bride or Groom</option>
                <option value="male">Grooms</option>
                <option value="female">Brides</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-stone-500">
            {loading ? 'Loading...' : `${profiles.length} profile${profiles.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Empty state */}
        {!loading && profiles.length === 0 && (
          <div className="card p-16 text-center">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400 text-xl">○</div>
            <p className="font-semibold text-stone-700">No profiles found</p>
            <p className="text-sm text-stone-400 mt-1">Try adjusting the filters above</p>
          </div>
        )}

        {/* Profile grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => (
            <Link href={`/profile/${p.id}`} key={p.id}>
              <div className="card card-hover overflow-hidden cursor-pointer">
                {/* Photo area */}
                <div className="h-36 flex items-center justify-center relative overflow-hidden" style={{background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)'}}>
                  <div style={{width: '5rem', height: '5rem', borderRadius: '9999px', background: avatarColor(p.full_name), filter: 'blur(12px)', opacity: 0.6}} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span className="text-xs text-stone-400">Photo after match</span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-stone-900">{p.full_name}</h3>
                      <p className="text-sm text-stone-500">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                    </div>
                    {p.verified && <span className="badge badge-verified">✓ Verified</span>}
                  </div>
                  <div className="space-y-1 mt-3 pt-3" style={{borderTop: '1px solid #F5F5F4'}}>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="text-stone-400">Native</span>
                      <span className="font-medium text-stone-700">{p.native_district}, {p.native_state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="text-stone-400">City</span>
                      <span className="font-medium text-stone-700">{p.current_city}</span>
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
