'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function Badge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span style={{
      position: 'absolute', top: '-3px', right: '-7px',
      minWidth: '15px', height: '15px', borderRadius: '99px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '9px', fontWeight: 700, color: 'white',
      background: '#DC2626', padding: '0 3px',
    }}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function MobileNav() {
  const path = usePathname()
  const [profileHref, setProfileHref] = useState('/profile/edit')
  const [pendingInterests, setPendingInterests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (id) {
      setProfileHref(`/profile/${id}`)
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
    } else {
      setProfileHref('/login')
    }
  }, [])

  const profileActive = path.startsWith('/profile')
  const inboxActive = path.startsWith('/matches') || path.startsWith('/chat')

  const items = [
    {
      href: '/browse', label: 'Home', active: path.startsWith('/browse'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      href: '/search', label: 'Search', active: path.startsWith('/search'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      ),
    },
    {
      href: '/interests', label: 'Interests', active: path.startsWith('/interests'), badge: pendingInterests,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    {
      href: '/matches', label: 'Inbox', active: inboxActive, badge: unreadMessages,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      href: '/dashboard', label: 'Profile', active: profileActive,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ]

  return (
    <nav className="sm:hidden" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#FFFFFF',
      borderTop: '1px solid #E8E8E8',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex' }}>
        {items.map(item => (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '10px 4px 10px', gap: '4px', minHeight: '58px',
            textDecoration: 'none',
            color: item.active ? '#7F1D1D' : '#AAAAAA',
            transition: 'color 0.15s',
          }}>
            <div style={{ position: 'relative' }}>
              {item.icon}
              {item.badge ? <Badge count={item.badge} /> : null}
            </div>
            <span style={{
              fontSize: '10px', fontWeight: item.active ? 700 : 400,
              letterSpacing: '0.01em',
            }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
