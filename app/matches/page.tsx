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
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #F0EDEA', padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginBottom: '6px' }}>No conversations yet</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>Express interest on a profile to start chatting immediately.</p>
            <Link href="/browse" className="btn-primary px-6 py-2.5">Browse Profiles</Link>
          </div>
        )}

        <div className="space-y-3">
          {matches.map(p => {
            const seenLabel = lastSeenLabel(p.last_login_at)
            return (
              <div key={p.id} style={{
                background: 'white', borderRadius: '16px',
                border: '1px solid #F0EDEA',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                padding: '16px',
                transition: 'box-shadow 0.15s',
              }}>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {p.photo_url && p.photo_visibility !== 'hidden' ? (
                      <img loading="lazy" src={p.photo_url} alt={p.full_name}
                        style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #F0EDEA' }} />
                    ) : (
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '16px',
                        background: 'linear-gradient(135deg, #7F1D1D, #9B1C1C)',
                        color: 'white',
                      }}>
                        {initials(p.full_name)}
                      </div>
                    )}
                    {p.is_mutual && (
                      <div style={{
                        position: 'absolute', bottom: 0, right: -2,
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: '#059669', border: '2px solid white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name + preview */}
                  <div className="flex-1 min-w-0">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</span>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', flexShrink: 0,
                          background: p.is_mutual ? '#ECFDF5' : '#F3F4F6',
                          color: p.is_mutual ? '#065F46' : '#6B7280',
                        }}>
                          {p.is_mutual ? 'Matched' : 'Interested'}
                        </span>
                      </div>
                      {p.last_message_at && (
                        <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>{msgTimestamp(p.last_message_at)}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                      {getAge(p.date_of_birth)} yrs · {p.profession || p.native_district}
                    </p>
                    {p.last_message ? (
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.last_message}</p>
                    ) : p.is_mutual ? (
                      <p style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '3px' }}>Say hello — you're connected!</p>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '3px' }}>{seenLabel || `Native: ${p.native_district}`}</p>
                    )}
                  </div>
                </div>

                {p.pending_interest_id && (
                  <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => respond(p.pending_interest_id!, true, p.match_id)}
                      disabled={responding === p.pending_interest_id}
                      style={{ flex: 1, padding: '9px', fontSize: '13px', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', background: '#059669', color: 'white', transition: 'opacity 0.15s' }}>
                      Accept
                    </button>
                    <button
                      onClick={() => respond(p.pending_interest_id!, false, p.match_id)}
                      disabled={responding === p.pending_interest_id}
                      style={{ flex: 1, padding: '9px', fontSize: '13px', fontWeight: 700, borderRadius: '12px', border: '1px solid #FCA5A5', cursor: 'pointer', background: 'white', color: '#DC2626', transition: 'opacity 0.15s' }}>
                      Decline
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                {!p.pending_interest_id && (
                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                    <Link href={`/profile/${p.id}`}
                      style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, borderRadius: '99px', border: '1px solid #E5E7EB', color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      View Profile
                    </Link>
                    <Link href={`/chat/${p.match_id}`}
                      style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 700, borderRadius: '99px', background: '#7F1D1D', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Message
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
