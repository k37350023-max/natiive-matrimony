'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Notif = {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
  from_profile_id: string | null
  link: string | null
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

function notifIcon(type: string) {
  const paths: Record<string, { d: string; color: string; bg: string }> = {
    interest_received:      { color: '#14241C', bg: '#EDF3ED', d: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>' },
    interest_accepted:      { color: '#2E7D32', bg: '#EAF3EA', d: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' },
    field_request_approved: { color: '#2E7D32', bg: '#EAF3EA', d: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' },
    profile_view:           { color: '#0369A1', bg: '#E0F2FE', d: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' },
    field_request:          { color: '#14241C', bg: '#EDF3ED', d: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>' },
  }
  const i = paths[type] || { color: '#5E6B62', bg: '#EFF1EC', d: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' }
  return (
    <span style={{ width: 30, height: 30, borderRadius: 8, background: i.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={i.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: i.d }} />
    </span>
  )
}

function notifLink(n: Notif): string | null {
  if (n.link) return n.link
  if (n.type === 'interest_received') return '/interests?tab=received'
  if (n.type === 'interest_accepted') return '/matches'
  if (n.type === 'profile_view' && n.from_profile_id) return `/profile/${n.from_profile_id}`
  if (n.type === 'field_request') return `/profile/${n.from_profile_id}`
  if (n.type === 'field_request_approved') return '/interests?tab=matched'
  return null
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifs, setNotifs]               = useState<Notif[]>([])
  const [open, setOpen]                   = useState(false)
  const [userId, setUserId]               = useState<string | null>(null)
  const [pushGranted, setPushGranted]     = useState(false)
  const [showPushBanner, setShowPushBanner] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const uid = localStorage.getItem('my_user_id')
    if (!uid) return
    setUserId(uid)
    load(uid)

    // Check push permission state
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushGranted(Notification.permission === 'granted')
      if (Notification.permission === 'default') {
        // Show banner after 10s if not already asked this session
        if (!sessionStorage.getItem('push_asked')) {
          setTimeout(() => setShowPushBanner(true), 10000)
        }
      }
    }

    const ch = supabase.channel('notif_bell_' + uid)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${uid}`,
      }, ({ new: n }) => {
        setNotifs(p => [n as Notif, ...p])
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('NativeMatrimony', { body: (n as Notif).message, icon: '/favicon.ico' })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function load(uid: string) {
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).limit(30)
    if (data) setNotifs(data)
  }

  async function markRead() {
    if (!userId) return
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'markAllRead' }) })
    setNotifs(p => p.map(n => ({ ...n, read: true })))
  }

  async function enablePush() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPushGranted(result === 'granted')
    setShowPushBanner(false)
    sessionStorage.setItem('push_asked', '1')
  }

  function handleNotifClick(n: Notif) {
    const link = notifLink(n)
    setOpen(false)
    // Mark this one read (secured, scoped to session user)
    fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'markRead', id: n.id }) })
    setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))
    if (link) router.push(link)
  }

  const unread = notifs.filter(n => !n.read).length
  if (!userId) return null

  return (
    <>
      {/* Push notification banner */}
      {showPushBanner && !pushGranted && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm w-full"
            style={{ background: '#14241C', color: 'white' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div className="flex-1">
              <p className="font-semibold text-white text-xs">Enable notifications</p>
              <p className="text-gray-400 text-xs">Get alerts when someone likes your profile</p>
            </div>
            <button onClick={enablePush}
              className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
              style={{ background: '#14241C', color: 'white' }}>
              Allow
            </button>
            <button onClick={() => { setShowPushBanner(false); sessionStorage.setItem('push_asked','1') }}
              className="text-gray-500 hover:text-gray-300 ml-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <div ref={ref} className="relative">
        <button
          onClick={() => { setOpen(o => !o); if (unread > 0) markRead() }}
          className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Notifications"
          style={{ minWidth: '40px', minHeight: '40px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-white"
              style={{ background: '#14241C', fontSize: '10px', fontWeight: 700 }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 w-80 rounded-xl shadow-xl border overflow-hidden z-50"
            style={{ background: 'white', borderColor: '#E7E3D8' }}>

            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#E7E3D8' }}>
              <span className="font-semibold text-gray-800 text-sm">
                Notifications {unread > 0 && <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#14241C' }}>{unread}</span>}
              </span>
              {!pushGranted && (
                <button onClick={enablePush}
                  className="text-xs font-semibold flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ background: '#EDF3ED', color: '#14241C' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  Enable alerts
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifs.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF1EC', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </span>
                  <p className="text-sm text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-300 mt-1">We'll alert you when someone shows interest</p>
                </div>
              ) : notifs.map(n => {
                const link = notifLink(n)
                return (
                  <div key={n.id}
                    onClick={() => link && handleNotifClick(n)}
                    className="px-4 py-3 flex gap-3 transition-colors"
                    style={{
                      background: n.read ? 'white' : '#EDF3ED',
                      cursor: link ? 'pointer' : 'default',
                    }}>
                    <span className="shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>

                      {/* Action button for profile_view notifications */}
                      {n.type === 'profile_view' && n.from_profile_id && (
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/profile/${n.from_profile_id}`); setOpen(false) }}
                          className="mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ background: '#14241C', color: 'white' }}>
                          View their profile →
                        </button>
                      )}
                      {n.type === 'interest_received' && (
                        <button
                          onClick={e => { e.stopPropagation(); router.push('/interests?tab=received'); setOpen(false) }}
                          className="mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ background: '#14241C', color: 'white' }}>
                          Review interest →
                        </button>
                      )}
                      {n.type === 'interest_accepted' && (
                        <button
                          onClick={e => { e.stopPropagation(); router.push('/matches'); setOpen(false) }}
                          className="mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ background: '#2E7D32', color: 'white' }}>
                          Open chat →
                        </button>
                      )}
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: '#14241C' }} />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="border-t px-4 py-2 flex items-center justify-between" style={{ borderColor: '#F3F4F6' }}>
              {notifs.length > 0 && (
                <button onClick={markRead} className="text-xs text-gray-400 hover:text-gray-600">
                  Mark all as read
                </button>
              )}
              <button onClick={() => { setOpen(false); router.push('/notifications') }}
                className="text-xs font-semibold ml-auto"
                style={{ color: '#14241C' }}>
                See all →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
