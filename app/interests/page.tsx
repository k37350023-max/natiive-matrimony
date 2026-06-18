'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MobileNav from '../components/MobileNav'
import LaunchBanner from '../components/LaunchBanner'
import NotificationBell from '../components/NotificationBell'

type Interest = {
  id: string
  from_user: string
  to_user: string
  status: string
  created_at: string
  note?: string
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

const COLORS = ['#B45309', '#0369A1', '#047857', '#6D28D9', '#BE185D']
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
  pending:  { label: 'Awaiting response', bg: '#FEF9EC', color: '#92400E', border: '#F0E4C0' },
  accepted: { label: 'Accepted ✓',        bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  rejected: { label: 'Declined',          bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
}

export default function InterestsPage() {
  const [tab, setTab] = useState<'received' | 'accepted' | 'sent'>('received')
  const [received, setReceived] = useState<Interest[]>([])
  const [accepted, setAccepted] = useState<Interest[]>([])
  const [sent, setSent] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const myId = typeof window !== 'undefined' ? localStorage.getItem('my_profile_id') : null

  useEffect(() => {
    if (myId) { loadAll() } else { setLoading(false) }
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadReceived(), loadAccepted(), loadSent()])
    setLoading(false)
  }

  async function loadReceived() {
    const { data: rows } = await supabase
      .from('interests').select('*')
      .eq('to_user', myId).eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (!rows?.length) { setReceived([]); return }
    const ids = rows.map(r => r.from_user)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
    setReceived(rows
      .map(r => ({ ...r, profile: profiles?.find(p => p.id === r.from_user) }))
      .filter(r => r.profile) as Interest[])
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

  async function respond(interestId: string, fromUser: string, accept: boolean) {
    await supabase.from('interests').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', interestId)
    if (accept) {
      const { data: existing } = await supabase.from('matches').select('id')
        .or(`and(user1.eq.${myId},user2.eq.${fromUser}),and(user1.eq.${fromUser},user2.eq.${myId})`)
        .maybeSingle()
      if (!existing) {
        await supabase.from('matches').insert({ user1: fromUser, user2: myId })
      }
      const [{ data: sender }, { data: me }] = await Promise.all([
        supabase.from('profiles').select('user_id, email').eq('id', fromUser).single(),
        supabase.from('profiles').select('full_name').eq('id', myId).single(),
      ])
      if (sender?.user_id) {
        supabase.from('notifications').insert({
          user_id: sender.user_id,
          type: 'interest_accepted',
          message: `${me?.full_name || 'Someone'} accepted your interest — you now have a mutual match!`,
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
            subject: 'Your interest was accepted — NatiiveMatrimony',
            html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#1C1917">Great news!</h2>
              <p style="color:#57534E"><strong>${me?.full_name || 'Someone'}</strong> accepted your interest. You now have a mutual match on NatiiveMatrimony.</p>
              <a href="https://nativematrimony.com/matches" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#B45309;color:white;border-radius:8px;text-decoration:none;font-weight:600">View Matches</a>
            </div>`
          })
        }).catch(() => {})
      }
    }
    setReceived(i => i.filter(r => r.id !== interestId))
    if (accept) loadAccepted()
  }

  if (!myId) return (
    <div className="min-h-screen" style={{background: '#FFFBF5'}}>
      <header className="bg-white border-b px-5 h-14 flex items-center justify-between" style={{borderColor: '#EDE8E0'}}>
        <Link href="/" className="text-lg font-bold text-stone-900 font-serif-display">Natiive<span style={{color: '#B45309'}}>Matrimony</span></Link>
      </header>
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="font-semibold text-stone-700 mb-2">Login to see interests</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 mt-2">Login</Link>
      </div>
    </div>
  )

  const ProfileCard = ({ i, showActions, isAccepted }: { i: Interest; showActions?: boolean; isAccepted?: boolean }) => {
    const seenLabel = lastSeenBadge(i.profile.last_login_at)
    return (
      <div className="card p-5">
        <div className="flex items-start gap-3">
          {i.profile.photo_url && i.profile.photo_visibility !== 'hidden' ? (
            <img src={i.profile.photo_url} alt={i.profile.full_name}
              className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-stone-100" />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{background: avatarBg(i.profile.full_name)}}>
              {initials(i.profile.full_name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/profile/${i.profile.id}`} className="font-bold text-stone-900 hover:text-amber-700 text-sm">{i.profile.full_name}</Link>
                  {i.profile.verified && <span className="badge badge-verified">✓ Verified</span>}
                  {seenLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: seenLabel === 'Active now' ? '#ECFDF5' : '#F5F5F4', color: seenLabel === 'Active now' ? '#065F46' : '#78716C' }}>
                      {seenLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{getAge(i.profile.date_of_birth)} yrs · {i.profile.profession}</p>
                <p className="text-xs mt-0.5" style={{color: '#92400E'}}>📍 {i.profile.native_district}, {i.profile.native_state}</p>
              </div>
              {!showActions && !isAccepted && (() => {
                const s = STATUS_STYLES[i.status] || STATUS_STYLES.pending
                return (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0"
                    style={{background: s.bg, color: s.color, borderColor: s.border}}>
                    {s.label}
                  </span>
                )
              })()}
            </div>
            {i.note && (
              <p className="mt-2 text-xs text-stone-500 italic bg-stone-50 rounded-lg px-3 py-2 border" style={{borderColor: '#E8E0D6'}}>
                "{i.note}"
              </p>
            )}
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => respond(i.id, i.from_user, true)}
              className="flex-1 py-2 text-white text-sm font-semibold rounded-lg"
              style={{background: '#059669'}}>
              Accept
            </button>
            <button onClick={() => respond(i.id, i.from_user, false)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg border"
              style={{borderColor: '#EDE8E0', color: '#78716C'}}>
              Decline
            </button>
          </div>
        )}
        {isAccepted && (
          <div className="flex gap-2 mt-4">
            <Link href={`/profile/${i.profile.id}`}
              className="flex-1 py-2 text-center text-sm font-semibold rounded-lg border"
              style={{borderColor: '#EDE8E0', color: '#57534E'}}>
              View Profile
            </Link>
            <Link href={`/matches`}
              className="flex-1 py-2 text-center text-white text-sm font-semibold rounded-lg"
              style={{background: '#B45309'}}>
              Go to Matches
            </Link>
          </div>
        )}
      </div>
    )
  }

  const tabs: { key: 'received' | 'accepted' | 'sent'; label: string; count: number }[] = [
    { key: 'received', label: 'Received', count: received.length },
    { key: 'accepted', label: 'Accepted', count: accepted.length },
    { key: 'sent',     label: 'Sent',     count: sent.length },
  ]

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{background: '#FFFBF5'}}>
      <header className="bg-white border-b sticky top-0 z-40" style={{borderColor: '#EDE8E0'}}>
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-stone-900 font-serif-display">Natiive<span style={{color: '#B45309'}}>Matrimony</span></Link>
          <div className="flex items-center gap-3">
            <Link href="/browse" className="text-sm text-stone-500 hover:text-amber-700">Browse</Link>
            <Link href="/matches" className="text-sm text-stone-500 hover:text-amber-700">Matches</Link>
            <NotificationBell />
          </div>
        </div>
      </header>
      <LaunchBanner />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-stone-900 font-serif-display mb-4">Interests</h1>

        {/* Tab bar */}
        <div className="flex rounded-xl p-1 mb-6" style={{background: '#F5F0EB'}}>
          {tabs.map(({ key, label, count }) => (
            <button key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              style={tab === key
                ? {background: 'white', color: '#1C1917', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'}
                : {color: '#78716C'}}>
              {label}
              {!loading && count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={tab === key
                    ? {background: '#B45309', color: 'white'}
                    : {background: '#E8E0D6', color: '#78716C'}}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && <p className="text-stone-400 text-sm text-center py-12">Loading...</p>}

        {/* Received tab */}
        {!loading && tab === 'received' && (
          <>
            {received.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-3xl mb-3">💌</p>
                <p className="font-semibold text-stone-700">No pending interests</p>
                <p className="text-sm text-stone-400 mt-1">When someone expresses interest in you, it appears here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-400 mb-3">Accept to create a mutual match — they can then see your full biodata</p>
                {received.map(i => <ProfileCard key={i.id} i={i} showActions />)}
              </div>
            )}
          </>
        )}

        {/* Accepted tab */}
        {!loading && tab === 'accepted' && (
          <>
            {accepted.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-3xl mb-3">✅</p>
                <p className="font-semibold text-stone-700">No accepted interests yet</p>
                <p className="text-sm text-stone-400 mt-1">Interests you've accepted will appear here. They become mutual matches.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg mb-1" style={{ background: '#ECFDF5' }}>
                  <span className="text-xs font-semibold text-stone-700">{accepted.length} interest{accepted.length !== 1 ? 's' : ''} accepted</span>
                  <span className="text-xs text-stone-400">These are now mutual matches</span>
                </div>
                {accepted.map(i => <ProfileCard key={i.id} i={i} isAccepted />)}
              </div>
            )}
          </>
        )}

        {/* Sent tab */}
        {!loading && tab === 'sent' && (
          <>
            {sent.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-3xl mb-3">🤝</p>
                <p className="font-semibold text-stone-700">No interests sent yet</p>
                <p className="text-sm text-stone-400 mt-1 mb-6">Browse profiles and express interest to get started.</p>
                <Link href="/browse" className="btn-primary px-6 py-2.5 text-sm">Browse Profiles</Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg mb-1" style={{ background: '#FEF9EC' }}>
                  <span className="text-xs font-semibold text-stone-700">{sent.length} interest{sent.length !== 1 ? 's' : ''} sent</span>
                  <span className="text-xs text-stone-400">Status updates when they respond</span>
                </div>
                {sent.map(i => <ProfileCard key={i.id} i={i} />)}
              </div>
            )}
          </>
        )}
      </div>
      <MobileNav />
    </div>
  )
}
