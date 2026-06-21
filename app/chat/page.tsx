'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MobileNav from '../components/MobileNav'
import AppHeader from '../components/AppHeader'

type ChatThread = {
  match_id: string
  profile_id: string
  full_name: string
  photo_url: string | null
  photo_visibility: string | null
  last_login_at: string | null
  last_message: string | null
  last_message_at: string | null
  unread: number
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function lastSeenLabel(ts: string | null): string | null {
  if (!ts) return null
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 5) return 'Online now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days <= 7) return `${days}d ago`
  return null
}

function timeLabel(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function ChatInboxPage() {
  const router = useRouter()
  const [myId, setMyId] = useState<string | null>(null)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (!id) { router.replace('/login'); return }
    setMyId(id)
    if (id) loadThreads(id)
    else setLoading(false)
  }, [])

  async function loadThreads(myId: string) {
    // Get all matches
    const { data: matchRows } = await supabase
      .from('matches').select('*').or(`user1.eq.${myId},user2.eq.${myId}`)
    if (!matchRows?.length) { setLoading(false); return }

    const otherIds = matchRows.map(m => m.user1 === myId ? m.user2 : m.user1)
    const matchByOtherId: Record<string, string> = {}
    matchRows.forEach(m => {
      const other = m.user1 === myId ? m.user2 : m.user1
      matchByOtherId[other] = m.id
    })

    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name, photo_url, photo_visibility, last_login_at')
      .in('id', otherIds)

    // Get last message + unread count for each match
    const matchIds = matchRows.map(m => m.id)
    const { data: lastMessages } = await supabase
      .from('messages').select('match_id, content, created_at, from_profile_id, read')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false })

    const result: ChatThread[] = (profiles || []).map(p => {
      const matchId = matchByOtherId[p.id]
      const msgs = (lastMessages || []).filter(m => m.match_id === matchId)
      const last = msgs[0] || null
      const unread = msgs.filter(m => m.from_profile_id !== myId && !m.read).length
      return {
        match_id: matchId,
        profile_id: p.id,
        full_name: p.full_name,
        photo_url: p.photo_url,
        photo_visibility: p.photo_visibility,
        last_login_at: p.last_login_at,
        last_message: last?.content ?? null,
        last_message_at: last?.created_at ?? null,
        unread,
      }
    }).sort((a, b) => {
      if (!a.last_message_at && !b.last_message_at) return 0
      if (!a.last_message_at) return 1
      if (!b.last_message_at) return -1
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    })

    setThreads(result)
    setLoading(false)
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#F8FAFC' }}>
      <AppHeader />

      <div className="max-w-2xl mx-auto">
        {loading && (
          <div className="flex flex-col gap-0">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#E8EDF3' }}>
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded animate-pulse w-32" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !myId && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 text-3xl" style={{ background: '#EAF8FE' }}>💬</div>
            <p className="font-semibold text-gray-800 text-lg mb-1">Sign in to see your messages</p>
            <p className="text-sm text-gray-400 mb-6">Messages unlock after a mutual match</p>
            <Link href="/login" className="btn-primary px-6 py-2.5">Sign In</Link>
          </div>
        )}

        {!loading && myId && threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 text-3xl" style={{ background: '#EAF8FE' }}>💬</div>
            <p className="font-semibold text-gray-800 text-lg mb-1">No messages yet</p>
            <p className="text-sm text-gray-400 mb-2">Messages unlock when you and another person both accept each other's interest.</p>
            <p className="text-sm text-gray-400 mb-6">Browse profiles, send an interest, and once they accept — you can chat here.</p>
            <Link href="/browse" className="btn-primary px-6 py-2.5">Browse Profiles</Link>
          </div>
        )}

        {!loading && threads.length > 0 && (
          <div>
            {threads.map(t => {
              const seenLabel = lastSeenLabel(t.last_login_at)
              const isOnline = seenLabel === 'Online now'
              return (
                <Link key={t.match_id} href={`/chat/${t.match_id}`}
                  className="flex items-center gap-3 px-5 py-4 border-b hover:bg-gray-50 transition-colors relative"
                  style={{ borderColor: '#E8EDF3' }}>
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {t.photo_url && t.photo_visibility !== 'hidden' ? (
                      <img loading="lazy" src={t.photo_url} alt={t.full_name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: '#0B132B' }}>
                        {initials(t.full_name)}
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                        style={{ background: '#22C55E' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${t.unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {t.full_name}
                      </span>
                      {t.last_message_at && (
                        <span className="text-xs shrink-0" style={{ color: t.unread > 0 ? '#0B132B' : '#94A3B8' }}>
                          {timeLabel(t.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${t.unread > 0 ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                        {t.last_message ?? (
                          <span className="italic">Say hello 👋</span>
                        )}
                      </p>
                      {t.unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1"
                          style={{ background: '#0B132B' }}>
                          {t.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  )
}
