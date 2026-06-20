'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_PASSWORD = 'natiive@admin2024'

type DailyStats = {
  date: string
  registrations: number
  interests: number
  matches: number
  messages: number
}

type Overview = {
  totalProfiles: number
  approvedProfiles: number
  pendingProfiles: number
  totalInterests: number
  totalMatches: number
  totalMessages: number
  premiumMembers: number
  profilesLast7Days: number
  maleCount: number
  femaleCount: number
}

export default function LaunchScorePage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [daily, setDaily] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(false)

  function login() {
    if (password === ADMIN_PASSWORD) setAuthed(true)
  }

  useEffect(() => {
    if (!authed) return
    load()
  }, [authed])

  async function load() {
    setLoading(true)
    const [
      { count: total },
      { count: approved },
      { count: pending },
      { count: interests },
      { count: matches },
      { count: messages },
      { count: premium },
      { count: last7 },
      { count: male },
      { count: female },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('interests').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).not('premium_expires_at', 'is', null).gte('premium_expires_at', new Date().toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gender', 'male'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gender', 'female'),
    ])

    setOverview({
      totalProfiles: total ?? 0,
      approvedProfiles: approved ?? 0,
      pendingProfiles: pending ?? 0,
      totalInterests: interests ?? 0,
      totalMatches: matches ?? 0,
      totalMessages: messages ?? 0,
      premiumMembers: premium ?? 0,
      profilesLast7Days: last7 ?? 0,
      maleCount: male ?? 0,
      femaleCount: female ?? 0,
    })

    // Build last 14 days of registration data
    const days: DailyStats[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)

      const [{ count: reg }, { count: int }, { count: mat }, { count: msg }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr).lt('created_at', nextDay.toISOString().split('T')[0]),
        supabase.from('interests').select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr).lt('created_at', nextDay.toISOString().split('T')[0]),
        supabase.from('matches').select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr).lt('created_at', nextDay.toISOString().split('T')[0]),
        supabase.from('messages').select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr).lt('created_at', nextDay.toISOString().split('T')[0]),
      ])

      days.push({ date: dateStr, registrations: reg ?? 0, interests: int ?? 0, matches: mat ?? 0, messages: msg ?? 0 })
    }
    setDaily(days)
    setLoading(false)
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Access</h1>
          <p className="text-sm text-gray-500 mb-6">Launch Analytics Dashboard</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Enter admin password"
            className="w-full border rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:ring-2"
            style={{ borderColor: '#E5E7EB' }}
          />
          <button onClick={login} className="w-full btn-primary py-3 text-sm">
            Enter Dashboard
          </button>
        </div>
      </div>
    )
  }

  const maxReg = Math.max(...daily.map(d => d.registrations), 1)

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Launch Score</h1>
            <p className="text-sm text-gray-500 mt-0.5">NativeMatrimony · Analytics</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="text-sm px-4 py-2 rounded-xl border font-medium hover:bg-gray-50" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
              Refresh
            </button>
            <Link href="/admin" className="text-sm px-4 py-2 rounded-xl border font-medium hover:bg-gray-50" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
              ← Admin
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-red-200 border-t-red-700 animate-spin" />
          </div>
        ) : overview && (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              {[
                { label: 'Total Profiles', value: overview.totalProfiles, color: '#7F1D1D' },
                { label: 'Approved', value: overview.approvedProfiles, color: '#059669' },
                { label: 'Pending', value: overview.pendingProfiles, color: '#D97706' },
                { label: 'Premium', value: overview.premiumMembers, color: '#7C3AED' },
                { label: 'New (7d)', value: overview.profilesLast7Days, color: '#0284C7' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: '#F3F4F6' }}>
                  <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Engagement row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: 'Interests Sent', value: overview.totalInterests },
                { label: 'Matches Made', value: overview.totalMatches },
                { label: 'Messages Sent', value: overview.totalMessages },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border text-center" style={{ borderColor: '#F3F4F6' }}>
                  <p className="text-3xl font-bold text-gray-800">{c.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Gender split */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border mb-8" style={{ borderColor: '#F3F4F6' }}>
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Gender Split</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Grooms ({overview.maleCount})</span>
                    <span>{overview.totalProfiles ? Math.round(overview.maleCount / overview.totalProfiles * 100) : 0}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                    <div className="h-full rounded-full" style={{ width: `${overview.totalProfiles ? overview.maleCount / overview.totalProfiles * 100 : 0}%`, background: '#3B82F6' }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Brides ({overview.femaleCount})</span>
                    <span>{overview.totalProfiles ? Math.round(overview.femaleCount / overview.totalProfiles * 100) : 0}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                    <div className="h-full rounded-full" style={{ width: `${overview.totalProfiles ? overview.femaleCount / overview.totalProfiles * 100 : 0}%`, background: '#EC4899' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Daily registrations chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border mb-8" style={{ borderColor: '#F3F4F6' }}>
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Daily Registrations (Last 14 days)</h2>
              <div className="flex items-end gap-1.5 h-32">
                {daily.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t-sm transition-all group-hover:opacity-80"
                        style={{
                          height: `${Math.max((d.registrations / maxReg) * 100, d.registrations > 0 ? 8 : 0)}%`,
                          background: '#9B1C1C',
                          minHeight: d.registrations > 0 ? '4px' : '0',
                        }}
                        title={`${d.date}: ${d.registrations} registrations`}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 rotate-45 origin-left w-6 overflow-hidden">
                      {d.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily activity table */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#F3F4F6' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#F3F4F6' }}>
                <h2 className="text-sm font-semibold text-gray-700">Daily Activity Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['Date', 'Registrations', 'Interests', 'Matches', 'Messages'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...daily].reverse().map(d => (
                      <tr key={d.date} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">{d.date}</td>
                        <td className="px-4 py-3 text-gray-600">{d.registrations}</td>
                        <td className="px-4 py-3 text-gray-600">{d.interests}</td>
                        <td className="px-4 py-3 text-gray-600">{d.matches}</td>
                        <td className="px-4 py-3 text-gray-600">{d.messages}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
