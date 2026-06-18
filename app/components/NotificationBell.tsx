'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Notif = {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const uid = localStorage.getItem('my_user_id')
    if (!uid) return
    setUserId(uid)
    load(uid)

    const ch = supabase.channel('notif_bell_' + uid)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${uid}`
      }, ({ new: n }) => {
        setNotifs(p => [n as Notif, ...p])
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('NatiiveMatrimony', {
            body: (n as Notif).message,
            icon: '/favicon.ico'
          })
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
      .order('created_at', { ascending: false }).limit(20)
    if (data) setNotifs(data)
  }

  async function markRead() {
    if (!userId) return
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', userId).eq('read', false)
    setNotifs(p => p.map(n => ({ ...n, read: true })))
  }

  async function askPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      await Notification.requestPermission()
      setOpen(false)
    }
  }

  const unread = notifs.filter(n => !n.read).length
  if (!userId) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (unread > 0) markRead() }}
        className="relative p-2 rounded-lg hover:bg-stone-50 text-stone-500 hover:text-stone-700 transition-colors"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-white"
            style={{ background: '#B45309', fontSize: '10px', fontWeight: 700 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 card shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#E8E0D6' }}>
            <span className="font-semibold text-stone-800 text-sm">Notifications</span>
            {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
              <button onClick={askPermission}
                className="text-xs font-semibold hover:underline" style={{ color: '#B45309' }}>
                Enable browser alerts
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-center text-sm text-stone-400 py-8">No notifications yet</p>
            ) : notifs.map(n => (
              <div key={n.id}
                className="px-4 py-3 border-b flex gap-3"
                style={{ borderColor: '#F0EBE3', background: n.read ? 'white' : '#FEF9EC' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ background: n.read ? '#D4CFC9' : '#B45309' }} />
                <div>
                  <p className="text-sm text-stone-700 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
