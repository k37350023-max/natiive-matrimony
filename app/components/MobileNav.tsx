'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function Badge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-0.5"
      style={{ background: '#DC2626' }}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function MobileNav() {
  const path = usePathname()
  const [profileHref, setProfileHref] = useState('/profile/edit')
  const [pendingInterests, setPendingInterests] = useState(0)
  const [matchCount, setMatchCount] = useState(0)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (id) {
      setProfileHref(`/profile/${id}`)
      supabase.from('interests').select('id', { count: 'exact', head: true })
        .eq('to_user', id).eq('status', 'pending')
        .then(({ count }) => setPendingInterests(count || 0))
      supabase.from('matches').select('id', { count: 'exact', head: true })
        .or(`user1.eq.${id},user2.eq.${id}`)
        .then(({ count }) => setMatchCount(count || 0))
    } else {
      setProfileHref('/login')
    }
  }, [])

  const profileActive = path.startsWith('/profile')

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50"
      style={{ borderColor: '#EDE8E0', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex">
        <Link href="/browse"
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={path.startsWith('/browse') ? '#B45309' : '#78716C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span className="text-xs font-semibold" style={{ color: path.startsWith('/browse') ? '#B45309' : '#78716C' }}>Browse</span>
        </Link>

        <Link href="/interests"
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]">
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke={path.startsWith('/interests') ? '#B45309' : '#78716C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <Badge count={pendingInterests} />
          </div>
          <span className="text-xs font-semibold" style={{ color: path.startsWith('/interests') ? '#B45309' : '#78716C' }}>Interests</span>
        </Link>

        <Link href="/matches"
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]">
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill={path.startsWith('/matches') ? '#B45309' : 'none'}
              stroke={path.startsWith('/matches') ? '#B45309' : '#78716C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <Badge count={matchCount} />
          </div>
          <span className="text-xs font-semibold" style={{ color: path.startsWith('/matches') ? '#B45309' : '#78716C' }}>Matches</span>
        </Link>

        <Link href={profileHref}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={profileActive ? '#B45309' : '#78716C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-xs font-semibold" style={{ color: profileActive ? '#B45309' : '#78716C' }}>Profile</span>
        </Link>
      </div>
    </nav>
  )
}
