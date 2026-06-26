'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MobileNav from '../components/MobileNav'
import AppHeader from '../components/AppHeader'
import AppFooter from '../components/AppFooter'

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

const COLORS = ['#14241C', '#0369A1', '#047857', '#6D28D9', '#BE185D']
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
  pending:  { label: 'Awaiting response', bg: '#EDF3ED', color: '#14241C', border: '#CADFCA' },
  accepted: { label: 'Accepted ✓',        bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  rejected: { label: 'Declined',          bg: '#EDF3ED', color: '#14241C', border: '#CADFCA' },
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

function RequestsPageInner() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'received'
  const [tab, setTab] = useState<'received' | 'matched' | 'sent' | 'saved'>(initialTab as 'received' | 'matched' | 'sent' | 'saved')
  const [received, setReceived] = useState<Interest[]>([])
  const [matched, setAccepted] = useState<Interest[]>([])
  const [sent, setSent] = useState<Interest[]>([])
  const [saved, setSaved] = useState<SavedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const myId = typeof window !== 'undefined' ? localStorage.getItem('my_profile_id') : null

  useEffect(() => {
    if (myId) { loadAll() } else { setLoading(false) }
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadReceived(), loadAccepted(), loadSent(), loadSaved()])
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

  async function loadAccepted() {
    const { data: rows } = await supabase
      .from('interests').select('*')
      .eq('to_user', myId).eq('status', 'accepted')
      .order('created_at', { ascending: false })
    if (!rows?.length) { setAccepted([]); return }
    const ids = rows.map(r => r.from_user)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
    setAccepted(rows
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
    // Secured: only the recipient (session) can respond; match created server-side.
    const res = await fetch('/api/interests/respond', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interestId, accept }),
    })
    if (!res.ok) return
    const data = await res.json()
    if (accept && data.matchId) {
      const senderName = data.senderName || received.find(r => r.id === interestId)?.profile?.full_name
      if (senderName) setAcceptedMatch({ name: senderName, matchId: data.matchId })
    }
    setReceived(i => i.filter(r => r.id !== interestId))
    if (accept) loadAccepted()
  }

  if (!myId) return (
    <div className="min-h-screen" style={{ background: '#FBFAF5' }}>
      <AppHeader />
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="font-semibold text-gray-700 mb-2">Login to see requests</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 mt-2">Login</Link>
      </div>
    </div>
  )

  const ProfileCard = ({ i, showActions, isAccepted }: { i: Interest; showActions?: boolean; isAccepted?: boolean }) => {
    const seenLabel = lastSeenBadge(i.profile.last_login_at)
    const unlocked = !!isAccepted
    const shownName = unlocked ? i.profile.full_name : 'Profile locked'
    return (
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E7E3D8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '16px' }}>
        <div className="flex items-start gap-3">
          <Link href={`/profile/${i.profile.id}`} className="shrink-0">
            {unlocked && i.profile.photo_url && i.profile.photo_visibility !== 'hidden' ? (
              <img loading="lazy" src={i.profile.photo_url} alt={shownName}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E7E3D8' }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '15px', fontWeight: 700, background: avatarBg(i.profile.full_name) }}>
                {unlocked ? initials(i.profile.full_name) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/profile/${i.profile.id}`} className="font-bold text-gray-900 text-sm hover:underline">{shownName}</Link>
                  {unlocked && i.profile.verified && <span className="badge badge-verified">✓ Verified</span>}
                  {seenLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: seenLabel === 'Active now' ? '#ECFDF5' : '#EFF1EC', color: seenLabel === 'Active now' ? '#065F46' : '#5E6B62' }}>
                      {seenLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{getAge(i.profile.date_of_birth)} yrs · {i.profile.profession}</p>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#14241C' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{i.profile.native_district}, {i.profile.native_state}</p>
              </div>
              {!showActions && !isAccepted && (() => {
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
                style={{ background: '#EDF3ED', borderLeft: '3px solid #14241C' }}>
                "{i.firstMessage.slice(0, 120)}{i.firstMessage.length > 120 ? '…' : ''}"
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-3">
            <Link href={`/profile/${i.profile.id}`}
              className="px-3 py-2 text-center text-xs font-semibold rounded-lg border"
              style={{ borderColor: '#E7E3D8', color: '#4B5563' }}>
              View Biodata
            </Link>
            <button onClick={() => respond(i.id, i.from_user, true)}
              style={{ flex: 1, padding: '9px', fontSize: '13px', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer', background: '#2E7D32', color: 'white' }}>
              Accept
            </button>
            <button onClick={() => respond(i.id, i.from_user, false)}
              style={{ flex: 1, padding: '9px', fontSize: '13px', fontWeight: 700, borderRadius: '12px', border: '1px solid #E7E3D8', cursor: 'pointer', background: 'white', color: '#5E6B62' }}>
              Decline
            </button>
          </div>
        )}

        {isAccepted && (
          <>
            {/* Contact info unlock on match */}
            {((i.profile as any).phone || (i.profile as any).email) && (
              <div className="mt-3 px-3 py-2.5 rounded-xl flex flex-wrap gap-3"
                style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <span className="text-xs font-semibold text-green-700">Biodata and contact unlocked</span>
                {(i.profile as any).phone && (
                  <a href={`tel:${(i.profile as any).phone}`}
                    className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: '#057A5B', textDecoration: 'none' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {(i.profile as any).phone}
                  </a>
                )}
                {(i.profile as any).phone && (
                  <a href={`https://wa.me/91${(i.profile as any).phone?.replace(/\D/g,'')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}>
                    WhatsApp
                  </a>
                )}
                {(i.profile as any).email && (
                  <a href={`mailto:${(i.profile as any).email}`}
                    className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: '#057A5B', textDecoration: 'none' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {(i.profile as any).email}
                  </a>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <Link href={`/profile/${i.profile.id}`}
                className="px-3 py-2 text-center text-xs font-semibold rounded-lg border"
                style={{ borderColor: '#E7E3D8', color: '#4B5563' }}>
                View locked profile
              </Link>
              <Link href="/matches"
                style={{ flex: 1, padding: '9px', textAlign: 'center', fontSize: '13px', fontWeight: 700, borderRadius: '12px', background: '#14241C', color: 'white', textDecoration: 'none', display: 'block' }}>
                Chat
              </Link>
            </div>
          </>
        )}

        {!showActions && !isAccepted && i.status === 'pending' && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={async () => {
                await supabase.from('interests').delete().eq('id', i.id)
                setSent(prev => prev.filter(x => x.id !== i.id))
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">
              Withdraw request
            </button>
          </div>
        )}
      </div>
    )
  }

  const tabs: { key: 'received' | 'sent' | 'matched' | 'saved'; label: string; count: number }[] = [
    { key: 'received', label: 'Received', count: received.length },
    { key: 'sent',     label: 'Sent',     count: sent.length },
    { key: 'matched',  label: 'Accepted',  count: matched.length },
    { key: 'saved',    label: 'Saved',    count: saved.length },
  ]

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#FBFAF5' }}>
      <AppHeader />
      {/* Accepted match banner */}
      {acceptedMatch && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#14241C' }}>Request accepted with {acceptedMatch.name}!</p>
              <p className="text-xs text-green-600 mt-0.5">Biodata and contact are now unlocked.</p>
            </div>
            <Link href="/matches"
              className="text-xs font-bold px-3 py-2 rounded-xl text-white shrink-0"
              style={{ background: '#2E7D32' }}>
              View connection →
            </Link>
            <button onClick={() => setAcceptedMatch(null)} className="text-green-400 hover:text-green-600 ml-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 font-serif-display mb-4">Requests</h1>

        <div className="flex rounded-xl p-1 mb-5" style={{ background: '#F3F4F6' }}>
          {tabs.map(({ key, label, count }) => (
            <button key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              style={tab === key
                ? { background: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#5E6B62' }}>
              {label}
              {!loading && count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={tab === key ? { background: '#14241C', color: 'white' } : { background: '#E7E3D8', color: '#5E6B62' }}>
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
            <div className="card p-12 text-center flex flex-col items-center">
              <span style={{ width: 52, height: 52, borderRadius: 14, background: '#EDF3ED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14241C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <p className="font-semibold text-gray-700">No pending requests</p>
              <p className="text-sm text-gray-400 mt-1">When someone sends you a request, it appears here.</p>
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
            <div className="card p-12 text-center flex flex-col items-center">
              <span style={{ width: 52, height: 52, borderRadius: 14, background: '#EDF3ED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14241C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              </span>
              <p className="font-semibold text-gray-700">No requests sent yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">Browse profiles and send request to get started.</p>
              <Link href="/browse" className="btn-primary px-6 py-2.5 text-sm">Browse Profiles</Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-1">{sent.length} sent — biodata unlocks after acceptance</p>
              {sent.map(i => <ProfileCard key={i.id} i={i} />)}
            </div>
          )
        )}

        {!loading && tab === 'matched' && (
          matched.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center">
              <span style={{ width: 52, height: 52, borderRadius: 14, background: '#EFF1EC', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <p className="font-semibold text-gray-700">No accepted connections yet</p>
              <p className="text-sm text-gray-400 mt-1">Requests you accept become accepted connections here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matched.map(i => <ProfileCard key={i.id} i={i} isAccepted />)}
            </div>
          )
        )}

        {!loading && tab === 'saved' && (
          saved.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center">
              <span style={{ width: 52, height: 52, borderRadius: 14, background: '#EDF3ED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14241C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </span>
              <p className="font-semibold text-gray-700">No saved profiles</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">Tap the heart on any profile to save them here.</p>
              <Link href="/browse" className="btn-primary px-6 py-2.5 text-sm">Browse Profiles</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {saved.map(p => {
                const age = p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null
                return (
                  <Link key={p.id} href={`/profile/${p.id}`}
                    className="bg-white overflow-hidden shadow-sm border hover:shadow-md transition-shadow"
                    style={{ borderColor: '#F3F4F6' }}>
                    <div className="relative" style={{ paddingBottom: '100%' }}>
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: avatarBg(p.full_name) }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(20,36,28,0.78)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm truncate">Profile locked</p>
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
      <AppFooter />
      <MobileNav />
    </div>
  )
}

export default function RequestsPage() {
  return (
    <Suspense>
      <RequestsPageInner />
    </Suspense>
  )
}
