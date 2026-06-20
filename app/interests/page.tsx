'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MobileNav from '../components/MobileNav'
import LaunchBanner from '../components/LaunchBanner'
import AppHeader from '../components/AppHeader'

type Interest = {
  id: string
  from_user: string
  to_user: string
  status: string
  created_at: string
  firstMessage?: string
  profile: {
    id: string
    full_name: string
    date_of_birth: string
    profession: string
    native_district: string
    native_state: string
    current_city: string
    verified: boolean
    last_login_at: string | null
    photo_url: string | null
    photo_visibility: string | null
  }
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = ['#9B1C1C', '#0369A1', '#047857', '#6D28D9', '#BE185D']
function avatarBg(name: string) { return COLORS[name.charCodeAt(0) % COLORS.length] }

function lastSeenBadge(ts: string | null): string | null {
  if (!ts) return null
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 60) return 'Active now'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Active ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days <= 7) return `Active ${days}d ago`
  return null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:  { label: 'Awaiting response', bg: '#FEF2F2', color: '#7F1D1D', border: '#FECACA' },
  accepted: { label: 'Accepted ✓',        bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  rejected: { label: 'Declined',          bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
}

type SavedProfile = {
  id: string
  full_name: string
  date_of_birth: string
  profession: string
  native_district: string
  native_state: string
  current_city: string
  verified: boolean
  photo_url: string | null
  photo_visibility: string | null
}

function InterestsPageInner() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'received'
  const [tab, setTab] = useState<'received' | 'matched' | 'sent' | 'saved'>(initialTab as 'received' | 'matched' | 'sent' | 'saved')
  const [received, setReceived] = useState<Interest[]>([])
  const [matched, setMatched] = useState<Interest[]>([])
  const [sent, setSent] = useState<Interest[]>([])
  const [saved, setSaved] = useState<SavedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const myId = typeof window !== 'undefined' ? localStorage.getItem('my_profile_id') : null

  useEffect(() => {
    if (myId) { loadAll() } else { setLoading(false) }
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadReceived(), loadMatched(), loadSent(), loadSaved()])
    setLoading(false)
  }

  async function loadSaved() {
    const { data } = await supabase
      .from('shortlists')
      .select('profile_id, profiles:profile_id(id, full_name, date_of_birth, profession, native_district, native_state, current_city, verified, photo_url, photo_visibility)')
      .eq('by_profile_id', myId)
      .order('created_at', { ascending: false })
    if (data) setSaved(data.map((r: any) => r.profiles).filter(Boolean))
  }

  async function loadReceived() {
    const { data: rows } = await supabase
      .from('interests').select('*')
      .eq('to_user', myId).eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (!rows?.length) { setReceived([]); return }
    const ids = rows.map(r => r.from_user)
    const [{ data: profiles }, { data: matchRows }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ids),
      supabase.from('matches').select('id,user1,user2').or(ids.map(id => `and(user1.eq.${id},user2.eq.${myId}),and(user1.eq.${myId},user2.eq.${id})`).join(',')),
    ])
    // Load first message per match
    const matchIds = (matchRows || []).map(m => m.id)
    const { data: msgs } = matchIds.length
      ? await supabase.from('messages').select('match_id,content').in('match_id', matchIds).order('created_at', { ascending: true })
      : { data: [] }

    setReceived(rows.map(r => {
      const matchRow = (matchRows || []).find(m => (m.user1 === r.from_user && m.user2 === myId) || (m.user1 === myId && m.user2 === r.from_user))
      const firstMsg = (msgs || []).find(m => m.match_id === matchRow?.id)
      return { ...r, firstMessage: firstMsg?.content, profile: profiles?.find(p => p.id === r.from_user) }
    }).filter(r => r.profile) as Interest[])
  }

  async function loadMatched() {
    const { data: rows } = await supabase
      .from('interests').select('*')
      .eq('to_user', myId).eq('status', 'accepted')
      .order('created_at', { ascending: false })
    if (!rows?.length) { setMatched([]); return }
    const ids = rows.map(r => r.from_user)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
    setMatched(rows
      .map(r => ({ ...r, profile: profiles?.find(p => p.id === r.from_user) }))
      .filter(r => r.profile) as Interest[])
  }

  async function loadSent() {
    const { data: rows } = await supabase
      .from('interests').select('*')
      .eq('from_user', myId)
      .order('created_at', { ascending: false })
    if (!rows?.length) { setSent([]); return }
    const ids = rows.map(r => r.to_user)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
    setSent(rows
      .map(r => ({ ...r, profile: profiles?.find(p => p.id === r.to_user) }))
      .filter(r => r.profile) as Interest[])
  }

  const [acceptedMatch, setAcceptedMatch] = useState<{ name: string; matchId: string } | null>(null)

  async function respond(interestId: string, fromUser: string, accept: boolean) {
    await supabase.from('interests').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', interestId)
    if (accept) {
      const { data: existing } = await supabase.from('matches').select('id')
        .or(`and(user1.eq.${myId},user2.eq.${fromUser}),and(user1.eq.${fromUser},user2.eq.${myId})`)
        .maybeSingle()
      let matchId = existing?.id
      if (!existing) {
        const { data: created } = await supabase.from('matches').insert({ user1: fromUser, user2: myId }).select('id').single()
        matchId = created?.id
      }
      const senderName = received.find(r => r.id === interestId)?.profile?.full_name
      if (matchId && senderName) setAcceptedMatch({ name: senderName, matchId })
      const [{ data: sender }, { data: me }] = await Promise.all([
        supabase.from('profiles').select('user_id, email').eq('id', fromUser).single(),
        supabase.from('profiles').select('full_name').eq('id', myId).single(),
      ])
      if (sender?.user_id) {
        supabase.from('notifications').insert({
          user_id: sender.user_id,
          type: 'interest_accepted',
          message: `${me?.full_name || 'Someone'} accepted your interest!`,
          from_profile_id: myId,
          read: false
        })
      }
      if (sender?.email) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: sender.email,
            subject: 'Your interest was accepted — NativeMatrimony',
            html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#111827">Great news!</h2>
              <p style="color:#4B5563"><strong>${me?.full_name || 'Someone'}</strong> accepted your interest. Go say hello!</p>
              <a href="https://nativematrimony.com/matches" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#9B1C1C;color:white;border-radius:8px;text-decoration:none;font-weight:600">Open Chat</a>
            </div>`
          })
        }).catch(() => {})
      }
    }
    setReceived(i => i.filter(r => r.id !== interestId))
    if (accept) loadMatched()
  }

  if (!myId) return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      <AppHeader />
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="font-semibold text-gray-700 mb-2">Login to see interests</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 mt-2">Login</Link>
      </div>
    </div>
  )

  const ProfileCard = ({ i, showActions, isMatched }: { i: Interest; showActions?: boolean; isMatched?: boolean }) => {
    const seenLabel = lastSeenBadge(i.profile.last_login_at)
    return (
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${i.profile.id}`} className="shrink-0">
            {i.profile.photo_url && i.profile.photo_visibility !== 'hidden' ? (
              <img loading="lazy" src={i.profile.photo_url} alt={i.profile.full_name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100" />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: avatarBg(i.profile.full_name) }}>
                {initials(i.profile.full_name)}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/profile/${i.profile.id}`} className="font-bold text-gray-900 text-sm hover:underline">{i.profile.full_name}</Link>
                  {i.profile.verified && <span className="badge badge-verified">✓ Verified</span>}
                  {seenLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: seenLabel === 'Active now' ? '#ECFDF5' : '#F5F5F4', color: seenLabel === 'Active now' ? '#065F46' : '#6B7280' }}>
                      {seenLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{getAge(i.profile.date_of_birth)} yrs · {i.profile.profession}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7F1D1D' }}>📍 {i.profile.native_district}, {i.profile.native_state}</p>
              </div>
              {!showActions && !isMatched && (() => {
                const s = STATUS_STYLES[i.status] || STATUS_STYLES.pending
                return (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0"
                    style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                    {s.label}
                  </span>
                )
              })()}
            </div>

            {/* First message preview */}
            {i.firstMessage && showActions && (
              <div className="mt-2 px-3 py-2 rounded-lg text-xs text-gray-600 italic"
                style={{ background: '#FEF2F2', borderLeft: '3px solid #9B1C1C' }}>
                "{i.firstMessage.slice(0, 120)}{i.firstMessage.length > 120 ? '…' : ''}"
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-3">
            <Link href={`/profile/${i.profile.id}`}
              className="px-3 py-2 text-center text-xs font-semibold rounded-lg border"
              style={{ borderColor: '#E5E7EB', color: '#4B5563' }}>
              View Profile
            </Link>
            <button onClick={() => respond(i.id, i.from_user, true)}
              className="flex-1 py-2 text-white text-sm font-semibold rounded-lg"
              style={{ background: '#059669' }}>
              Accept
            </button>
            <button onClick={() => respond(i.id, i.from_user, false)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg border"
              style={{ borderColor: '#EDE8E0', color: '#6B7280' }}>
              Decline
            </button>
          </div>
        )}

        {isMatched && (
          <div className="flex gap-2 mt-3">
            <Link href={`/profile/${i.profile.id}`}
              className="px-3 py-2 text-center text-xs font-semibold rounded-lg border"
              style={{ borderColor: '#E5E7EB', color: '#4B5563' }}>
              View Profile
            </Link>
            <Link href="/matches"
              className="flex-1 py-2 text-center text-white text-sm font-semibold rounded-lg"
              style={{ background: '#9B1C1C' }}>
              Open Chat
            </Link>
          </div>
        )}

        {!showActions && !isMatched && i.status === 'pending' && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={async () => {
                await supabase.from('interests').delete().eq('id', i.id)
                setSent(prev => prev.filter(x => x.id !== i.id))
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">
              Withdraw interest
            </button>
          </div>
        )}
      </div>
    )
  }

  const tabs: { key: 'received' | 'sent' | 'matched' | 'saved'; label: string; count: number }[] = [
    { key: 'received', label: 'Received', count: received.length },
    { key: 'sent',     label: 'Sent',     count: sent.length },
    { key: 'matched',  label: 'Matched',  count: matched.length },
    { key: 'saved',    label: 'Saved',    count: saved.length },
  ]

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#F9FAFB' }}>
      <AppHeader />
      <LaunchBanner />

      {/* Accepted match banner */}
      {acceptedMatch && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">You're now matched with {acceptedMatch.name}!</p>
              <p className="text-xs text-green-600 mt-0.5">Start a conversation — they're waiting to hear from you.</p>
            </div>
            <Link href={`/chat/${acceptedMatch.matchId}`}
              className="text-xs font-bold px-3 py-2 rounded-xl text-white shrink-0"
              style={{ background: '#059669' }}>
              Start chat →
            </Link>
            <button onClick={() => setAcceptedMatch(null)} className="text-green-400 hover:text-green-600 ml-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 font-serif-display mb-4">Interests</h1>

        <div className="flex rounded-xl p-1 mb-5" style={{ background: '#F3F4F6' }}>
          {tabs.map(({ key, label, count }) => (
            <button key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              style={tab === key
                ? { background: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#6B7280' }}>
              {label}
              {!loading && count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={tab === key ? { background: '#9B1C1C', color: 'white' } : { background: '#E5E7EB', color: '#6B7280' }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({length: 3}).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'received' && (
          received.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-3xl mb-3">💌</p>
              <p className="font-semibold text-gray-700">No pending interests</p>
              <p className="text-sm text-gray-400 mt-1">When someone expresses interest in you, it appears here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-1">Review their message and profile before accepting</p>
              {received.map(i => <ProfileCard key={i.id} i={i} showActions />)}
            </div>
          )
        )}

        {!loading && tab === 'sent' && (
          sent.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-3xl mb-3">🤝</p>
              <p className="font-semibold text-gray-700">No interests sent yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">Browse profiles and express interest to get started.</p>
              <Link href="/browse" className="btn-primary px-6 py-2.5 text-sm">Browse Profiles</Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-1">{sent.length} sent — you can chat while awaiting response</p>
              {sent.map(i => <ProfileCard key={i.id} i={i} />)}
            </div>
          )
        )}

        {!loading && tab === 'matched' && (
          matched.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-3xl mb-3">✅</p>
              <p className="font-semibold text-gray-700">No mutual matches yet</p>
              <p className="text-sm text-gray-400 mt-1">Interests you accept become mutual matches here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matched.map(i => <ProfileCard key={i.id} i={i} isMatched />)}
            </div>
          )
        )}

        {!loading && tab === 'saved' && (
          saved.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-3xl mb-3">🔖</p>
              <p className="font-semibold text-gray-700">No saved profiles</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">Tap the heart on any profile to save them here.</p>
              <Link href="/browse" className="btn-primary px-6 py-2.5 text-sm">Browse Profiles</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {saved.map(p => {
                const age = p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null
                const showPhoto = p.photo_url && p.photo_visibility === 'public'
                return (
                  <Link key={p.id} href={`/profile/${p.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow"
                    style={{ borderColor: '#F3F4F6' }}>
                    <div className="relative" style={{ paddingBottom: '100%' }}>
                      {showPhoto ? (
                        <img loading="lazy" src={p.photo_url!} alt={p.full_name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: avatarBg(p.full_name) }}>
                          <span className="text-3xl font-bold text-white">{initials(p.full_name)}</span>
                        </div>
                      )}
                      {p.verified && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm truncate">{p.full_name}</p>
                      <p className="text-xs text-gray-500">{age ? `${age} yrs` : ''}{p.profession ? ` · ${p.profession}` : ''}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{[p.native_district, p.native_state].filter(Boolean).join(', ')}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}
      </div>
      <MobileNav />
    </div>
  )
}

export default function InterestsPage() {
  return (
    <Suspense>
      <InterestsPageInner />
    </Suspense>
  )
}
