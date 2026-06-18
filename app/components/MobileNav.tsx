'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  {
    href: '/browse',
    label: 'Browse',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#B45309' : '#78716C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    href: '/interests',
    label: 'Interests',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#B45309' : '#78716C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    href: '/matches',
    label: 'Matches',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#B45309' : 'none'}
        stroke={active ? '#B45309' : '#78716C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
]

export default function MobileNav() {
  const path = usePathname()
  const [profileHref, setProfileHref] = useState('/profile/edit')

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (id) setProfileHref(`/profile/${id}`)
    else setProfileHref('/login')
  }, [])

  const profileActive = path.startsWith('/profile')

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50"
      style={{ borderColor: '#EDE8E0', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex">
        {NAV.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]">
              {icon(active)}
              <span className="text-xs font-semibold" style={{ color: active ? '#B45309' : '#78716C' }}>
                {label}
              </span>
            </Link>
          )
        })}

        {/* Profile tab */}
        <Link href={profileHref}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={profileActive ? '#B45309' : '#78716C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-xs font-semibold" style={{ color: profileActive ? '#B45309' : '#78716C' }}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  )
}
