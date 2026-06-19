'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HeroCTA() {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setProfileId(localStorage.getItem('my_profile_id'))
    setReady(true)
  }, [])

  if (!ready) return (
    <div className="flex flex-row gap-2 justify-center items-center">
      <div className="h-9 w-32 rounded-lg bg-gray-200 animate-pulse" />
      <div className="h-9 w-24 rounded-lg bg-gray-100 animate-pulse" />
    </div>
  )

  return (
    <div className="flex flex-row gap-2 sm:gap-3 justify-center items-center">
      {profileId ? (
        <>
          <Link href={`/profile/${profileId}`} className="btn-primary px-5 py-2 sm:px-7 sm:py-3 text-sm">
            My Profile
          </Link>
          <Link href="/browse" className="btn-ghost px-5 py-2 sm:px-7 sm:py-3 text-sm">
            Browse
          </Link>
        </>
      ) : (
        <>
          <Link href="/register" className="btn-primary px-5 py-2 sm:px-7 sm:py-3 text-sm flex-1 sm:flex-none sm:w-auto">
            Create Profile
          </Link>
          <Link href="/browse" className="btn-ghost px-5 py-2 sm:px-7 sm:py-3 text-sm flex-1 sm:flex-none sm:w-auto">
            Browse
          </Link>
        </>
      )}
    </div>
  )
}
