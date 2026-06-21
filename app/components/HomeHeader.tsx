'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomeHeader() {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    setProfileId(id)
    setReady(true)
    if (id) router.replace('/browse')
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E7E3D8',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: scrolled ? '0 6px 20px rgba(20,36,28,0.08)' : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{
        maxWidth: '1120px', margin: '0 auto', padding: '0 20px',
        height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-space-grotesk), sans-serif',
          fontSize: '23px', letterSpacing: '-0.03em', lineHeight: 1,
        }}>
          <span style={{ fontWeight: 700, color: '#14241C' }}>native</span><span style={{ fontWeight: 400, color: '#1B5E20' }}>matrimony</span><span style={{ fontWeight: 700, color: '#1B5E20' }}>.</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {ready && profileId ? (
            <>
              <Link href="/browse" style={{ fontSize: '13.5px', fontWeight: 500, color: '#555', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none' }}>Browse</Link>
              <Link href="/interests" style={{ fontSize: '13.5px', fontWeight: 500, color: '#555', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none' }}>Interests</Link>
              <Link href="/matches" style={{ fontSize: '13.5px', fontWeight: 500, color: '#555', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none' }}>Matches</Link>
              <Link href={`/profile/${profileId}`} className="btn-primary" style={{ fontSize: '13.5px', padding: '8px 18px', marginLeft: '4px' }}>My Profile</Link>
            </>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: '13.5px', fontWeight: 500, color: '#555', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none' }}>Login</Link>
              <Link href="/register" className="btn-primary" style={{ fontSize: '13.5px', padding: '8px 18px', marginLeft: '4px' }}>Register Free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
