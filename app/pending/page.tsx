'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PendingPage() {
  useEffect(() => {
    // Save latest profile ID to localStorage for demo purposes
    async function saveProfileId() {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (data?.id) localStorage.setItem('my_profile_id', data.id)
    }
    saveProfileId()
  }, [])

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-xl shadow p-8">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-orange-700 mb-2">Profile Submitted!</h1>
        <p className="text-gray-600 mb-4">
          Your profile is under review. We verify every profile manually to ensure quality matches.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          You will receive an email once your profile is approved (usually within 24 hours).
        </p>
        <Link href="/browse" className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
          Browse Profiles
        </Link>
      </div>
    </div>
  )
}
