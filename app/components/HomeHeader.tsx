'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomeHeader() {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    setProfileId(id)
    setReady(true)
    if (id) router.replace('/browse')
  }, [])

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E8E8E8',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1120px', margin: '0 auto', padding: '0 20px',
        height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-inter), sans-serif',
          fontSize: '18px', fontWeight: 800,
          letterSpacing: '-0.04em', color: '#111111', lineHeight: 1,
        }}>
          Native<span style={{ color: '#7F1D1D' }}>Matrimony</span>
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
