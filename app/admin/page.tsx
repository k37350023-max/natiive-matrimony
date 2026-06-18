'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_PASSWORD = 'natiive@admin2024'

type Profile = {
  id: string
  full_name: string
  gender: string
  date_of_birth: string
  profession: string
  native_district: string
  native_state: string
  current_city: string
  status: string
  verified: boolean
  created_at: string
  email: string
  phone: string
  education: string
  caste: string
  about: string
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')

  function login() {
    if (password === ADMIN_PASSWORD) setAuthed(true)
    else alert('Incorrect password')
  }

  useEffect(() => { if (authed) loadProfiles() }, [authed, filter])

  async function loadProfiles() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('status', filter).order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    await supabase.from('profiles').update({ status, verified: status === 'approved' }).eq('id', id)
    loadProfiles()
  }

  const tabCounts: Record<string, number | null> = { pending: null, approved: null, rejected: null }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#FFF7ED'}}>
        <div className="card p-8 w-80">
          <div className="text-center mb-6">
            <p className="text-sm font-bold text-orange-700 mb-1">NatiiveMatrimony</p>
            <h1 className="text-xl font-bold text-stone-900">Admin Login</h1>
          </div>
          <div className="space-y-4">
            <div>
              <label className="section-label block mb-1.5">Password</label>
              <input type="password" className="input" placeholder="Enter admin password" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
            </div>
            <button onClick={login} className="btn-primary w-full py-2.5">Sign In</button>
          </div>
        </div>
      </div>
    )
  }

  const tabs: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected']

  return (
    <div className="min-h-screen" style={{background: '#F9FAFB'}}>
      {/* Header */}
      <header style={{background: 'white', borderBottom: '1px solid #E5E7EB'}}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-base font-bold text-stone-900">Natiive<span className="text-orange-700">Matrimony</span></Link>
            <span className="ml-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">Admin</span>
          </div>
          <button onClick={() => setAuthed(false)} className="text-sm text-stone-500 hover:text-stone-800">Sign out</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Profile Reviews</h1>
          <p className="text-stone-500 text-sm mt-1">Approve or reject submitted profiles</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white rounded-lg border border-stone-200 w-fit">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-5 py-2 rounded-md text-sm font-semibold capitalize transition-all ${filter === t ? 'bg-orange-700 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12 text-stone-400 text-sm">Loading profiles...</div>
        )}

        {!loading && profiles.length === 0 && (
          <div className="card p-12 text-center">
            <p className="font-semibold text-stone-700">No {filter} profiles</p>
            <p className="text-sm text-stone-400 mt-1">Check back later</p>
          </div>
        )}

        <div className="space-y-3">
          {profiles.map(p => (
            <div key={p.id} className="card p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {p.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-900">{p.full_name}</h3>
                      <span className={`badge ${p.status === 'approved' ? 'badge-approved' : p.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                        {p.status}
                      </span>
                      {p.verified && <span className="badge badge-verified">Verified</span>}
                    </div>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {p.gender} · {p.date_of_birth ? new Date(p.date_of_birth + 'T00:00:00').toLocaleDateString('en-IN') : '—'} · {p.profession}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-stone-400">
                      <span>Native: {p.native_district}, {p.native_state}</span>
                      <span>City: {p.current_city}</span>
                      {p.email && <span>{p.email}</span>}
                      {p.phone && <span>{p.phone}</span>}
                    </div>
                    {p.caste && <p className="text-xs text-stone-400 mt-0.5">Caste: {p.caste} · Education: {p.education}</p>}
                    {p.about && <p className="text-xs text-stone-500 mt-2 italic">"{p.about}"</p>}
                    <p className="text-xs text-stone-300 mt-2">Submitted {new Date(p.created_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {filter === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(p.id, 'approved')}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                        Approve
                      </button>
                      <button onClick={() => updateStatus(p.id, 'rejected')}
                        className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                        Reject
                      </button>
                    </>
                  )}
                  {filter === 'rejected' && (
                    <button onClick={() => updateStatus(p.id, 'approved')}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border border-green-600 text-green-600 hover:bg-green-50 transition-colors">
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
