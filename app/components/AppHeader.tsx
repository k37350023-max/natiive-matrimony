'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import NotificationBell from './NotificationBell'

export default function AppHeader() {
  const path = usePathname()
  const router = useRouter()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [memberNumber, setMemberNumber] = useState<number | null>(null)
  const [pendingInterests, setPendingInterests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    setProfileId(id)
    setReady(true)
    if (!id) return

    supabase.from('profiles')
      .select('full_name, photo_url, photo_visibility, premium_expires_at, member_number')
      .eq('id', id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileName(data.full_name || '')
          setPhotoUrl(data.photo_visibility === 'public' ? data.photo_url : null)
          setMemberNumber(data.member_number ?? null)
          setIsPremium(!!data.premium_expires_at && new Date(data.premium_expires_at) > new Date())
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

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function signOut() {
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    router.push('/login')
  }

  const navItems = [
    { href: '/browse',    label: 'Browse',    active: path.startsWith('/browse') },
    { href: '/interests', label: 'Interests', active: path.startsWith('/interests'), badge: pendingInterests },
    { href: '/chat',      label: 'Chat',      active: path.startsWith('/chat'), badge: unreadMessages },
    { href: '/matches',   label: 'Matches',   active: path.startsWith('/matches') },
  ]

  return (
    <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E5E7EB' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={profileId ? '/browse' : '/'} className="text-lg font-bold font-serif-display shrink-0 tracking-tight">
          Natiive<span style={{ color: '#9B1C1C' }}>Matrimony</span>
        </Link>

        {/* Nav links — desktop */}
        {ready && profileId && (
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                className="relative flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: item.active ? '#7F1D1D' : '#6B7280', background: item.active ? '#FEF2F2' : 'transparent' }}>
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
              {/* Profile avatar + dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200 shrink-0 transition-all hover:ring-gray-400"
                  style={{ outline: 'none' }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt={profileName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: '#7F1D1D' }}>
                      {profileName ? initials(profileName) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                    </div>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border bg-white shadow-lg overflow-hidden z-50"
                    style={{ borderColor: '#E5E7EB' }}>
                    {/* Identity row */}
                    <div className="px-4 py-3 border-b" style={{ borderColor: '#F3F4F6' }}>
                      <p className="text-sm font-semibold text-gray-800 truncate">{profileName}</p>
                      {isPremium ? (
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#7F1D1D' }}>
                          {memberNumber ? `Founder Member #${memberNumber}` : 'Premium Member'}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">Free account</p>
                      )}
                    </div>
                    {/* Menu items */}
                    <div className="py-1">
                      <Link href={`/profile/${profileId}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        View Profile
                      </Link>
                      <Link href="/profile/edit"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit Profile
                      </Link>
                      {!isPremium && (
                        <Link href="/pricing"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                          style={{ color: '#7F1D1D' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          Upgrade to Premium
                        </Link>
                      )}
                    </div>
                    <div className="border-t py-1" style={{ borderColor: '#F3F4F6' }}>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : ready && (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 hidden sm:block">Login</Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-1.5">Register Free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
