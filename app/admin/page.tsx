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
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'fake'>('pending')
  const [fakeProfiles, setFakeProfiles] = useState<(Profile & { _flags: string[]; _score: number })[]>([])
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementSending, setAnnouncementSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  function login() {
    if (password === ADMIN_PASSWORD) setAuthed(true)
    else alert('Incorrect password')
  }

  useEffect(() => { if (authed) { if (filter === 'fake') loadFakeProfiles(); else loadProfiles() } }, [authed, filter])

  async function loadProfiles() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('status', filter).order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  async function loadFakeProfiles() {
    setLoading(true)
    const [{ data }, { data: reports }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('reported, reason'),
    ])
    const all = data || []

    // Count reports per profile
    const reportCounts: Record<string, string[]> = {}
    ;(reports || []).forEach(r => {
      if (!reportCounts[r.reported]) reportCounts[r.reported] = []
      reportCounts[r.reported].push(r.reason)
    })

    // Score each profile
    const scored = all.map(p => {
      const flags: string[] = []
      // User reports — most important
      const userReports = reportCounts[p.id] || []
      if (userReports.length > 0) {
        flags.push(`Reported ${userReports.length}x: ${[...new Set(userReports)].join(', ')}`)
      }
      if (!p.photo_url) flags.push('No photo')
      if (!p.about || p.about.trim().length < 20) flags.push('No bio')
      if (!p.profession) flags.push('No profession')
      if (!p.education) flags.push('No education')
      if (!p.phone || p.phone.replace(/\D/g,'').length < 10) flags.push('Invalid phone')
      if (!p.caste) flags.push('No caste')
      if (!p.native_district) flags.push('No native district')
      if (p.about && p.about.trim().split(/\s+/).length < 5) flags.push('Bio too short')
      return { ...p, _flags: flags, _score: flags.length + userReports.length * 2 }
    }).filter(p => p._score >= 1 && p._flags.length > 0)
      .sort((a, b) => b._score - a._score)

    // Duplicate phone detection
    const phoneCounts: Record<string, number> = {}
    all.forEach(p => { if (p.phone) phoneCounts[p.phone] = (phoneCounts[p.phone] || 0) + 1 })
    scored.forEach(p => { if (p.phone && phoneCounts[p.phone] > 1) p._flags.push('Duplicate phone') })

    setFakeProfiles(scored)
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    await supabase.from('profiles').update({ status, verified: status === 'approved' }).eq('id', id)
    loadProfiles()
  }

  async function hardDelete(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    await supabase.from('profiles').delete().eq('id', id)
    if (filter === 'fake') loadFakeProfiles(); else loadProfiles()
  }

  function exportCSV() {
    const rows = [
      ['Name','Gender','DOB','Profession','Native District','State','City','Email','Phone','Status','Verified','Created'],
      ...profiles.map(p => [
        p.full_name, p.gender, p.date_of_birth, p.profession,
        p.native_district, p.native_state, p.current_city,
        p.email, p.phone, p.status, p.verified ? 'Yes' : 'No',
        new Date(p.created_at).toLocaleDateString('en-IN')
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `natiive-${filter}-profiles-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  async function sendAnnouncement() {
    if (!announcementText.trim()) return
    setAnnouncementSending(true)
    const { data: allProfiles } = await supabase.from('profiles').select('id').eq('status','approved')
    if (allProfiles?.length) {
      const notifications = allProfiles.map(p => ({
        profile_id: p.id,
        message: announcementText.trim(),
        link: '/',
        read: false,
      }))
      await supabase.from('notifications').insert(notifications)
    }
    setAnnouncementText('')
    setShowAnnouncement(false)
    setAnnouncementSending(false)
    alert(`Announcement sent to ${allProfiles?.length || 0} members.`)
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#FFF7ED'}}>
        <div className="card p-8 w-80">
          <div className="text-center mb-6">
            <p className="text-sm font-bold text-orange-700 mb-1">NativeMatrimony</p>
            <h1 className="text-xl font-bold text-gray-900">Admin Login</h1>
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

  const tabs: Array<{ key: 'pending' | 'approved' | 'rejected' | 'fake'; label: string }> = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'fake', label: '🚩 Suspicious' },
  ]

  return (
    <div className="min-h-screen" style={{background: '#F9FAFB'}}>
      {/* Header */}
      <header style={{background: 'white', borderBottom: '1px solid #E5E7EB'}}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-base font-bold text-gray-900">Native<span className="text-orange-700">Matrimony</span></Link>
            <span className="ml-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</span>
          </div>
          <button onClick={() => setAuthed(false)} className="text-sm text-gray-500 hover:text-gray-800">Sign out</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Reviews</h1>
            <p className="text-gray-500 text-sm mt-1">Approve or reject submitted profiles</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowAnnouncement(s => !s)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors">
              📢 Announce
            </button>
            <button onClick={exportCSV}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              ↓ Export CSV
            </button>
            <Link href="/admin/launch-score"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-700 text-white hover:bg-orange-800 transition-colors">
              Dashboard →
            </Link>
          </div>
        </div>

        {showAnnouncement && (
          <div className="card p-4 mb-6 border border-blue-200" style={{ background: '#EFF6FF' }}>
            <p className="text-sm font-bold text-blue-900 mb-2">Send announcement to all approved members</p>
            <textarea className="input w-full text-sm" rows={3} placeholder="Type your announcement..."
              value={announcementText} onChange={e => setAnnouncementText(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button onClick={sendAnnouncement} disabled={announcementSending || !announcementText.trim()}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
                {announcementSending ? 'Sending…' : 'Send to all'}
              </button>
              <button onClick={() => setShowAnnouncement(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </div>
        )}

        {/* Tabs + Search */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200 w-fit">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${filter === t.key ? 'bg-orange-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input text-sm flex-1 min-w-[220px] max-w-xs"
          />
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading profiles...</div>
        )}

        {!loading && profiles.length === 0 && (
          <div className="card p-12 text-center">
            <p className="font-semibold text-gray-700">No {filter} profiles</p>
            <p className="text-sm text-gray-400 mt-1">Check back later</p>
          </div>
        )}

        <div className="space-y-3">
          {profiles.filter(p => {
            if (!searchQuery.trim()) return true
            const q = searchQuery.toLowerCase()
            return (p.full_name||'').toLowerCase().includes(q) || (p.email||'').toLowerCase().includes(q) || (p.phone||'').includes(q)
          }).map(p => (
            <div key={p.id} className="card p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {p.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{p.full_name}</h3>
                      <span className={`badge ${p.status === 'approved' ? 'badge-approved' : p.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                        {p.status}
                      </span>
                      {p.verified && <span className="badge badge-verified">Verified</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {p.gender} · {p.date_of_birth ? new Date(p.date_of_birth + 'T00:00:00').toLocaleDateString('en-IN') : '—'} · {p.profession}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-400">
                      <span>Native: {p.native_district}, {p.native_state}</span>
                      <span>City: {p.current_city}</span>
                      {p.email && <span>{p.email}</span>}
                      {p.phone && <span>{p.phone}</span>}
                    </div>
                    {p.caste && <p className="text-xs text-gray-400 mt-0.5">Caste: {p.caste} · Education: {p.education}</p>}
                    {p.about && <p className="text-xs text-gray-500 mt-2 italic">"{p.about}"</p>}
                    <p className="text-xs text-gray-300 mt-2">Submitted {new Date(p.created_at).toLocaleString('en-IN')}</p>
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
                  <button onClick={() => hardDelete(p.id, p.full_name)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suspicious / fake profiles list */}
        {filter === 'fake' && !loading && (
          <div>
            {fakeProfiles.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="font-semibold text-gray-700">No suspicious profiles detected</p>
                <p className="text-sm text-gray-400 mt-1">All profiles look legitimate</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-4">{fakeProfiles.length} profiles flagged by heuristics (missing data, short bio, invalid phone, duplicate phone)</p>
                <div className="space-y-3">
                  {fakeProfiles.map((p: Profile & { _flags: string[]; _score: number }) => (
                    <div key={p.id} className="card p-5 border-l-4" style={{ borderLeftColor: p._score >= 5 ? '#DC2626' : '#F59E0B' }}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                            style={{ background: p._score >= 5 ? '#FEE2E2' : '#FEF3C7', color: p._score >= 5 ? '#DC2626' : '#92400E' }}>
                            {p.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a href={`/profile/${p.id}`} target="_blank" rel="noopener"
                                className="font-bold text-gray-900 text-sm hover:underline">{p.full_name}</a>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: p._score >= 5 ? '#FEE2E2' : '#FEF3C7', color: p._score >= 5 ? '#DC2626' : '#92400E' }}>
                                {p._score} flags
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{p.status}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{p.gender} · {p.profession || '—'} · {p.native_district}, {p.native_state}</p>
                            {p.email && <p className="text-xs text-gray-400 mt-0.5">{p.email} {p.phone && `· ${p.phone}`}</p>}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p._flags.map((flag: string) => (
                                <span key={flag} className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: '#FEE2E2', color: '#991B1B' }}>
                                  🚩 {flag}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-300 mt-2">Joined {new Date(p.created_at).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={() => updateStatus(p.id, 'rejected')}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                            Remove
                          </button>
                          <button onClick={() => updateStatus(p.id, 'approved')}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-green-500 text-green-700 hover:bg-green-50 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => hardDelete(p.id, p.full_name)}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
