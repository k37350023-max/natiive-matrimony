'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { computeCompleteness } from '@/lib/completeness'
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
  const [completeness, setCompleteness] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    setProfileId(id)
    setReady(true)
    if (!id) return

    supabase.from('profiles')
      .select('full_name, photo_url, photo_visibility, premium_expires_at, member_number, gender, date_of_birth, native_state, native_district, about, profession, education, height_cm, religion, current_city, caste, annual_income, mother_tongue, family_type, company, diet, star, rashi')
      .eq('id', id).maybeSingle()
      .then(({ data }) => {
        if (!data) {
          localStorage.removeItem('my_profile_id')
          localStorage.removeItem('my_user_id')
          router.replace('/login')
          return
        }
        setProfileName(data.full_name || '')
        setPhotoUrl(data.photo_visibility === 'public' ? data.photo_url : null)
        setMemberNumber(data.member_number ?? null)
        setIsPremium(!!data.premium_expires_at && new Date(data.premium_expires_at) > new Date())
        setCompleteness(computeCompleteness(data).percent)
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

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function signOut() {
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    router.push('/')
  }

  const navItems = [
    { href: '/browse',    label: 'Home',      active: path.startsWith('/browse') },
    { href: '/search',    label: 'Search',    active: path.startsWith('/search') },
    { href: '/interests', label: 'Interests', active: path.startsWith('/interests'), badge: pendingInterests },
    { href: '/chat',      label: 'Chat',      active: path.startsWith('/chat'), badge: unreadMessages },
    { href: '/matches',   label: 'Matches',   active: path.startsWith('/matches') },
  ]

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E7E3D8',
      position: 'sticky', top: 0, zIndex: 40,
      boxShadow: scrolled ? '0 6px 20px rgba(20,36,28,0.08)' : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{
        maxWidth: '1120px', margin: '0 auto', padding: '0 20px',
        height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px',
      }}>

        {/* Wordmark */}
        <Link href={profileId ? '/browse' : '/'} style={{ flexShrink: 0, textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: '21px', letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            <span style={{ fontWeight: 700, color: '#14241C' }}>native</span><span style={{ fontWeight: 400, color: '#1B5E20' }}>matrimony</span><span style={{ fontWeight: 700, color: '#1B5E20' }}>.</span>
          </span>
        </Link>

        {/* Nav links — desktop */}
        {ready && profileId && (
          <nav style={{ display: 'none', alignItems: 'center', gap: '0px' }} className="hdr-nav">
            <style>{`.hdr-nav { display: none; } @media(min-width:640px){.hdr-nav{display:flex;}}`}</style>
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                style={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '13.5px', fontWeight: item.active ? 700 : 500,
                  padding: '8px 14px', textDecoration: 'none',
                  color: item.active ? '#14241C' : '#555555',
                  borderBottom: item.active ? '2.5px solid #14241C' : '2.5px solid transparent',
                  marginBottom: '-1px',
                  transition: 'color 0.15s',
                }}>
                {item.label}
                {(item.badge ?? 0) > 0 && (
                  <span style={{
                    minWidth: '16px', height: '16px', borderRadius: '99px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#DC2626', color: 'white', fontSize: '9.5px', fontWeight: 700, padding: '0 4px',
                  }}>
                    {(item.badge ?? 0) > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {ready && profileId ? (
            <>
              <NotificationBell />
              <div style={{ position: 'relative' }} ref={menuRef}>
                {completeness !== null && completeness < 100 && (
                  <>
                    {/* Completeness ring around the avatar */}
                    <svg width="46" height="46" viewBox="0 0 46 46"
                      style={{ position: 'absolute', top: '-5px', left: '-5px', pointerEvents: 'none', transform: 'rotate(-90deg)' }}>
                      <circle cx="23" cy="23" r="21" fill="none" stroke="#EFE7E2" strokeWidth="3" />
                      <circle cx="23" cy="23" r="21" fill="none" stroke="#14241C" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 21}
                        strokeDashoffset={2 * Math.PI * 21 * (1 - completeness / 100)}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                    </svg>
                    {/* Percentage pill */}
                    <span style={{
                      position: 'absolute', bottom: '-7px', left: '50%', transform: 'translateX(-50%)',
                      background: '#14241C', color: 'white', fontSize: '8.5px', fontWeight: 700,
                      lineHeight: 1, padding: '2px 5px', borderRadius: '99px', border: '1.5px solid white',
                      whiteSpace: 'nowrap', pointerEvents: 'none',
                    }}>
                      {completeness}%
                    </span>
                  </>
                )}
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden',
                    border: menuOpen ? '2px solid #14241C' : '2px solid #E0E0E0',
                    cursor: 'pointer', background: 'none', padding: 0,
                    transition: 'border-color 0.15s',
                  }}>
                  {photoUrl ? (
                    <img loading="lazy" src={photoUrl} alt={profileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#14241C', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                      {profileName ? initials(profileName) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      )}
                    </div>
                  )}
                </button>

                {menuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: '224px', borderRadius: '12px',
                    background: 'white', border: '1px solid #E8E8E8',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 50,
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileName}</p>
                      {isPremium ? (
                        <p style={{ fontSize: '11.5px', fontWeight: 600, color: '#14241C', margin: '2px 0 0' }}>
                          {memberNumber ? `Founder #${memberNumber}` : 'Premium Member'}
                        </p>
                      ) : (
                        <p style={{ fontSize: '11.5px', color: '#999', margin: '2px 0 0' }}>Free account</p>
                      )}
                    </div>
                    {completeness !== null && completeness < 100 && (
                      <Link href="/profile/edit" onClick={() => setMenuOpen(false)}
                        style={{ display: 'block', padding: '12px 16px', borderBottom: '1px solid #F0F0F0', textDecoration: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#14241C' }}>Profile {completeness}% complete</span>
                          <span style={{ fontSize: '11px', color: '#14241C', fontWeight: 600 }}>Complete →</span>
                        </div>
                        <div style={{ height: '5px', borderRadius: '99px', background: '#EFE7E2', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${completeness}%`, background: '#14241C', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                        </div>
                      </Link>
                    )}
                    <div style={{ padding: '6px' }}>
                      {[
                        { href: `/profile/${profileId}`, label: 'View Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4' },
                        { href: '/profile/edit', label: 'Edit Profile', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', textDecoration: 'none', color: '#333', fontSize: '13.5px', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#EFF1EC')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d={item.icon} />
                          </svg>
                          {item.label}
                        </Link>
                      ))}
                      {!isPremium && (
                        <Link href="/pricing" onClick={() => setMenuOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', textDecoration: 'none', color: '#14241C', fontSize: '13.5px', fontWeight: 600, transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#EDF3ED')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          Upgrade to Premium
                        </Link>
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid #F0F0F0', padding: '6px' }}>
                      <button onClick={signOut}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '13.5px', transition: 'all 0.1s', textAlign: 'left' }}
                        onMouseEnter={e => { (e.currentTarget.style.background = '#EFF1EC'); (e.currentTarget.style.color = '#333') }}
                        onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = '#999') }}>
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
              <Link href="/login"
                style={{ fontSize: '13.5px', fontWeight: 500, color: '#555', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none', transition: 'color 0.15s' }}
                className="hidden sm:block">
                Login
              </Link>
              <Link href="/register" className="btn-primary" style={{ fontSize: '13.5px', padding: '8px 18px' }}>
                Register Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
