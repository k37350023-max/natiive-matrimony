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
    // Redirect logged-in users away from marketing homepage
    if (id) router.replace('/browse')
  }, [])

  return (
    <header className="bg-white border-b sticky top-0 z-50" style={{ borderColor: '#E8E0D6' }}>
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight text-stone-900 font-serif-display">
          Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
        </span>
        <div className="flex items-center gap-1">
          {ready && profileId ? (
            <>
              <Link href="/browse" className="text-sm font-medium text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Browse</Link>
              <Link href="/interests" className="text-sm font-medium text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Interests</Link>
              <Link href="/matches" className="text-sm font-medium text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-50 hidden sm:block">Matches</Link>
              <Link href={`/profile/${profileId}`} className="btn-primary text-sm px-4 py-1.5 ml-1">My Profile</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-50">Login</Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-1.5 ml-1">Register Free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
