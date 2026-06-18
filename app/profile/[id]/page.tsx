'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = {
  id: string
  full_name: string
  gender: string
  date_of_birth: string
  profession: string
  education: string
  native_district: string
  native_state: string
  native_region: string
  current_city: string
  current_state: string
  height_cm: number
  religion: string
  caste: string
  mother_tongue: string
  family_type: string
  about: string
  verified: boolean
  phone: string
  email: string
}

function getAge(dob: string) {
  const diff = Date.now() - new Date(dob + 'T00:00:00').getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export default function ProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [interestSent, setInterestSent] = useState(false)
  const [shortlisted, setShortlisted] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [id])

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
    setLoading(false)
  }

  async function expressInterest() {
    setSending(true)
    const myId = localStorage.getItem('my_profile_id')
    if (!myId) {
      setSending(false)
      alert('Please register your profile first to express interest.')
      router.push('/register')
      return
    }
    if (myId === id) {
      setSending(false)
      alert('This is your own profile!')
      return
    }
    const { error } = await supabase.from('interests').insert({
      from_user: myId,
      to_user: id,
      status: 'pending',
    })
    if (error) {
      alert(error.message)
    } else {
      setInterestSent(true)
    }
    setSending(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-gray-400">Profile not found</div>

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="bg-orange-700 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm underline">← Browse</Link>
          <span className="text-xl font-bold">Profile</span>
        </div>
        <Link href="/matches" className="text-sm text-white underline">My Matches</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Photo (blurred) */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="h-64 bg-gradient-to-br from-orange-100 to-orange-200 flex flex-col items-center justify-center relative">
            <div className="w-32 h-32 rounded-full bg-orange-300 flex items-center justify-center text-6xl blur-md">
              {profile.gender === 'female' ? '👩' : '👨'}
            </div>
            <p className="absolute bottom-4 text-sm text-orange-700 bg-orange-50 px-3 py-1 rounded-full">
              📷 Photo unlocks after mutual match
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">{profile.full_name}</h1>
              {profile.verified && <span className="text-blue-500 text-sm">✓ Verified</span>}
            </div>
            <p className="text-gray-500">{getAge(profile.date_of_birth)} years · {profile.gender === 'male' ? 'Groom' : 'Bride'}</p>
          </div>
        </div>

        {/* 3 info rows */}
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏡</span>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Native Place</p>
              <p className="font-medium text-gray-800">{profile.native_district}, {profile.native_state}</p>
              <p className="text-xs text-gray-500">{profile.native_region}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Current City</p>
              <p className="font-medium text-gray-800">{profile.current_city}, {profile.current_state}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">💼</span>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Profession</p>
              <p className="font-medium text-gray-800">{profile.profession}</p>
              {profile.education && <p className="text-xs text-gray-500">{profile.education}</p>}
            </div>
          </div>
        </div>

        {/* Locked biodata */}
        <div className="bg-white rounded-xl shadow p-5 relative overflow-hidden">
          <div className="blur-sm pointer-events-none select-none">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Height</span><p className="font-medium">{profile.height_cm} cm</p></div>
              <div><span className="text-gray-400">Religion</span><p className="font-medium">{profile.religion}</p></div>
              <div><span className="text-gray-400">Caste</span><p className="font-medium">{profile.caste}</p></div>
              <div><span className="text-gray-400">Mother Tongue</span><p className="font-medium">{profile.mother_tongue}</p></div>
              <div><span className="text-gray-400">Family Type</span><p className="font-medium capitalize">{profile.family_type}</p></div>
              <div><span className="text-gray-400">Phone</span><p className="font-medium">{profile.phone}</p></div>
              <div className="col-span-2"><span className="text-gray-400">About</span><p className="font-medium">{profile.about}</p></div>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70">
            <span className="text-3xl mb-2">🔒</span>
            <p className="font-semibold text-gray-700">Full biodata locked</p>
            <p className="text-sm text-gray-500">Unlocks after mutual interest</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={expressInterest}
            disabled={interestSent || sending}
            className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-60"
          >
            {interestSent ? '✓ Interest Sent' : sending ? 'Sending...' : '💌 Express Interest'}
          </button>
          <button
            onClick={() => setShortlisted(s => !s)}
            className={`px-5 py-3 rounded-xl border font-semibold ${shortlisted ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {shortlisted ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
