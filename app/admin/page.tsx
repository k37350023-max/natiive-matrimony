'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    else alert('Wrong password')
  }

  useEffect(() => {
    if (authed) loadProfiles()
  }, [authed, filter])

  async function loadProfiles() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    await supabase.from('profiles').update({
      status,
      verified: status === 'approved',
    }).eq('id', id)
    loadProfiles()
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow w-80">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Admin Login</h1>
          <input
            type="password"
            className="input mb-4"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          <button onClick={login} className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">NatiiveMatrimony Admin</h1>
        <button onClick={() => setAuthed(false)} className="text-sm underline">Logout</button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize font-medium text-sm ${filter === f ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && profiles.length === 0 && (
          <div className="text-center py-16 text-gray-400">No {filter} profiles</div>
        )}

        <div className="space-y-4">
          {profiles.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{p.full_name}</h2>
                  <p className="text-sm text-gray-500">
                    {p.gender} · {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-IN') : '—'} · {p.profession}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Native: {p.native_district}, {p.native_state} · Current: {p.current_city}
                  </p>
                  <p className="text-sm text-gray-500">
                    {p.email} · {p.phone}
                  </p>
                  {p.education && <p className="text-sm text-gray-500">Education: {p.education}</p>}
                  {p.caste && <p className="text-sm text-gray-500">Caste: {p.caste}</p>}
                  {p.about && <p className="text-sm text-gray-600 mt-2 italic">"{p.about}"</p>}
                  <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(p.created_at).toLocaleString('en-IN')}</p>
                </div>
                {filter === 'pending' && (
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => updateStatus(p.id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Approve ✓
                    </button>
                    <button
                      onClick={() => updateStatus(p.id, 'rejected')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                      Reject ✗
                    </button>
                  </div>
                )}
                {filter === 'approved' && (
                  <span className="text-green-600 font-semibold text-sm">✓ Verified</span>
                )}
                {filter === 'rejected' && (
                  <button
                    onClick={() => updateStatus(p.id, 'approved')}
                    className="px-3 py-1 border border-green-600 text-green-600 rounded text-sm hover:bg-green-50"
                  >
                    Re-approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
