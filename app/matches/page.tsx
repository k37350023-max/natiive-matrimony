'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MobileNav from '../components/MobileNav'
import LaunchBanner from '../components/LaunchBanner'
import AppHeader from '../components/AppHeader'

type MatchEntry = {
  id: string
  full_name: string
  date_of_birth: string
  profession: string
  native_district: string
  native_state: string
  current_city: string
  photo_url: string | null
  photo_visibility: string | null
  last_login_at: string | null
  match_id: string
  is_mutual: boolean
  last_message: string | null
  last_message_at: string | null
  pending_interest_id: string | null
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function lastSeenLabel(ts: string | null): string | null {
  if (!ts) return null
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 5) return 'Online now'
  if (mins < 60) return `Active ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Active ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days <= 7) return `Active ${days}d ago`
  return null
}

function msgTimestamp(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function MatchesPage() {
  const [myId, setMyId] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  async function respond(interestId: string, accept: boolean, matchId: string) {
    setResponding(interestId)
    await supabase.from('interests').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', interestId)
    setMatches(prev => prev.map(m =>
      m.match_id === matchId
        ? { ...m, is_mutual: accept, pending_interest_id: null }
        : m
    ))
    setResponding(null)
  }

  const router = useRouter()
  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (!id) { router.replace('/login'); return }
    setMyId(id)
    loadMatches(id)
  }, [])

  async function loadMatches(id: string) {
    const { data: matchRows } = await supabase.from('matches').select('*').or(`user1.eq.${id},user2.eq.${id}`)
    if (!matchRows?.length) { setLoading(false); return }

    const otherIds = matchRows.map(m => m.user1 === id ? m.user2 : m.user1)

    // Load profiles + mutual interest check + last messages in parallel
    const [{ data: profiles }, { data: sentInterests }, { data: receivedInterests }, { data: lastMsgs }] = await Promise.all([
      supabase.from('profiles').select('id,full_name,date_of_birth,profession,native_district,native_state,current_city,photo_url,photo_visibility,last_login_at').in('id', otherIds),
      supabase.from('interests').select('id,from_user,to_user,status').eq('from_user', id).in('to_user', otherIds),
      supabase.from('interests').select('id,from_user,to_user,status').eq('to_user', id).in('from_user', otherIds),
      supabase.from('messages').select('match_id,content,created_at').in('match_id', matchRows.map(m => m.id)).order('created_at', { ascending: false }),
    ])

    const enriched: MatchEntry[] = (profiles || []).map(p => {
      const matchRow = matchRows.find(m => m.user1 === p.id || m.user2 === p.id)!
      const iSent = (sentInterests || []).find(i => i.to_user === p.id)
      const theySet = (receivedInterests || []).find(i => i.from_user === p.id)
      const is_mutual = !!(iSent && theySet) || iSent?.status === 'accepted' || theySet?.status === 'accepted'
      const pending_interest_id = (theySet && theySet.status === 'pending') ? theySet.id : null
      const msgs = (lastMsgs || []).filter(m => m.match_id === matchRow.id)
      const last = msgs[0]
      return {
        ...p,
        match_id: matchRow.id,
        is_mutual,
        last_message: last?.content?.slice(0, 60) || null,
        last_message_at: last?.created_at || null,
        pending_interest_id,
      }
    }).filter(p => p.match_id)
      .sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''))

    setMatches(enriched)
    setLoading(false)
  }

  if (!myId) return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      <AppHeader />
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="font-semibold text-gray-800 mb-2">Login to see your inbox</p>
        <Link href="/login" className="btn-primary px-6 py-2.5">Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#F9FAFB' }}>
      <AppHeader />
      <LaunchBanner />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500 text-sm mt-0.5">Matches and interests in one place</p>
        </div>

        {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>}

        {!loading && matches.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF2F2' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-700">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Express interest on a profile to start chatting immediately.</p>
            <Link href="/browse" className="btn-primary px-6 py-2.5">Browse Profiles</Link>
          </div>
        )}

        <div className="space-y-3">
          {matches.map(p => {
            const seenLabel = lastSeenLabel(p.last_login_at)
            return (
              <div key={p.id} className="card p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {p.photo_url && p.photo_visibility !== 'hidden' ? (
                    <img loading="lazy" src={p.photo_url} alt={p.full_name}
                      className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-gray-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                      style={{ background: '#FEF2F2', color: '#9B1C1C' }}>
                      {initials(p.full_name)}
                    </div>
                  )}

                  {/* Name + preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-gray-900 text-sm truncate">{p.full_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.is_mutual ? 'text-green-700' : 'text-gray-500'}`}
                          style={{ background: p.is_mutual ? '#ECFDF5' : '#F3F4F6' }}>
                          {p.is_mutual ? 'Matched ✓' : 'Interested'}
                        </span>
                      </div>
                      {p.last_message_at && (
                        <span className="text-[11px] text-gray-400 shrink-0">{msgTimestamp(p.last_message_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {getAge(p.date_of_birth)} yrs · {p.profession || p.native_district}
                    </p>
                    {p.last_message ? (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{p.last_message}</p>
                    ) : (
                      <p className="text-xs mt-0.5" style={{ color: '#9B1C1C' }}>
                        {seenLabel || `Native: ${p.native_district}`}
                      </p>
                    )}
                  </div>
                </div>

                {p.pending_interest_id && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => respond(p.pending_interest_id!, true, p.match_id)}
                      disabled={responding === p.pending_interest_id}
                      className="flex-1 py-2 text-sm font-bold rounded-xl text-white transition-all"
                      style={{ background: '#16A34A' }}>
                      Accept
                    </button>
                    <button
                      onClick={() => respond(p.pending_interest_id!, false, p.match_id)}
                      disabled={responding === p.pending_interest_id}
                      className="flex-1 py-2 text-sm font-bold rounded-xl border transition-all"
                      style={{ borderColor: '#FCA5A5', color: '#DC2626' }}>
                      Decline
                    </button>
                  </div>
                )}

                {!p.pending_interest_id && !p.last_message && p.is_mutual && (
                  <p className="text-xs mt-2 font-medium" style={{ color: '#059669' }}>
                    You're connected — say hello in chat 👋
                  </p>
                )}

                {/* Action buttons */}
                {!p.pending_interest_id && <div className="flex gap-2 mt-3">
                  <Link href={`/profile/${p.id}`}
                    style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '9999px', border: '1px solid #E5E7EB', color: '#6B7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    View Profile
                  </Link>
                  <Link href={`/chat/${p.match_id}`}
                    style={{ padding: '7px 16px', fontSize: '12px', fontWeight: 600, borderRadius: '9999px', background: '#7F1D1D', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Message
                  </Link>
                </div>}
              </div>
            )
          })}
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
