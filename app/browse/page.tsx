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
  native_region: string
  current_city: string
  verified: boolean
  photo_url?: string
}

function getAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
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

  useEffect(() => {
    loadProfiles()
  }, [region, state, district, gender])

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
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-orange-700 text-white px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">NatiiveMatrimony</Link>
        <Link href="/register" className="text-sm bg-white text-orange-700 px-4 py-1 rounded-full font-medium">Register</Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">Filter by Native Place</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select className="input" value={region} onChange={e => { setRegion(e.target.value); setState(''); setDistrict('') }}>
              <option value="">All Regions</option>
              {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="input" value={state} onChange={e => { setState(e.target.value); setDistrict('') }} disabled={!region}>
              <option value="">All States</option>
              {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input" value={district} onChange={e => setDistrict(e.target.value)} disabled={!state}>
              <option value="">All Districts</option>
              {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">Both</option>
              <option value="male">Grooms</option>
              <option value="female">Brides</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">{profiles.length} profile{profiles.length !== 1 ? 's' : ''} found</p>

        {loading && <p className="text-gray-400 text-center py-10">Loading profiles...</p>}

        {!loading && profiles.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>No profiles found. Try changing the filters.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => (
            <Link href={`/profile/${p.id}`} key={p.id}>
              <div className="bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer overflow-hidden">
                {/* Blurred photo placeholder */}
                <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center relative">
                  <div className="w-24 h-24 rounded-full bg-orange-300 flex items-center justify-center text-4xl blur-sm">
                    {p.gender === 'female' ? '👩' : '👨'}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full">Photo visible after match</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{p.full_name}</h3>
                    {p.verified && <span className="text-blue-500 text-xs">✓ Verified</span>}
                  </div>
                  <p className="text-sm text-gray-500">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                  <p className="text-sm text-gray-500 mt-1">🏡 {p.native_district}, {p.native_state}</p>
                  <p className="text-sm text-gray-500">📍 {p.current_city}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
