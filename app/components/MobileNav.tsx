'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
        <path d="M20 12C20 16.4183 12 21 12 21C12 21 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z"/>
        <path d="M12 8v4M12 16h.01"/>
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
      </div>
    </nav>
  )
}
