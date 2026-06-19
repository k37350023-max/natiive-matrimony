'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import NotificationBell from './NotificationBell'

export default function AppHeader() {
  const path = usePathname()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [pendingInterests, setPendingInterests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    setProfileId(id)
    setReady(true)
    if (!id) return

    supabase.from('profiles').select('full_name, photo_url, photo_visibility').eq('id', id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileName(data.full_name || '')
          setPhotoUrl(data.photo_visibility === 'public' ? data.photo_url : null)
        }
      })

    supabase.from('interests').select('id', { count: 'exact', head: true })
      .eq('to_user', id).eq('status', 'pending')
      .then(({ count }) => setPendingInterests(count || 0))

    supabase.from('matches').select('id').or(`user1.eq.${id},user2.eq.${id}`)
      .then(({ data: matchRows }) => {
        if (!matchRows?.length) return
        supabase.from('messages').select('id', { count: 'exact', head: true })
          .in('match_id', matchRows.map(m => m.id))
          .neq('from_profile_id', id).eq('read', false)
          .then(({ count }) => setUnreadMessages(count || 0))
      })
  }, [])

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const navItems = [
    { href: '/browse',    label: 'Browse',    active: path.startsWith('/browse') },
    { href: '/interests', label: 'Interests', active: path.startsWith('/interests'), badge: pendingInterests },
    { href: '/chat',      label: 'Chat',      active: path.startsWith('/chat'), badge: unreadMessages },
    { href: '/matches',   label: 'Matches',   active: path.startsWith('/matches') },
  ]

  return (
    <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E8E0D6' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={profileId ? '/browse' : '/'} className="text-base font-bold text-stone-900 font-serif-display shrink-0">
          Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
        </Link>

        {/* Nav links — desktop */}
        {ready && profileId && (
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                className="relative flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: item.active ? '#B45309' : '#78716C', background: item.active ? '#FEF9EC' : 'transparent' }}>
                {item.label}
                {(item.badge ?? 0) > 0 && (
                  <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1"
                    style={{ background: '#DC2626' }}>
                    {(item.badge ?? 0) > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {ready && profileId ? (
            <>
              <NotificationBell />
              <Link href={`/profile/${profileId}`}
                className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden ring-2 shrink-0 transition-all hover:ring-amber-400"
                style={{ outline: 'none' }}
                title={profileName}>
                {photoUrl ? (
                  <img src={photoUrl} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#B45309' }}>
                    {profileName ? initials(profileName) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                  </div>
                )}
              </Link>
            </>
          ) : ready && (
            <>
              <Link href="/login" className="text-sm font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Login</Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-1.5">Register Free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
