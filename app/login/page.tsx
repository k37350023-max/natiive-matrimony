'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    const userId = data.user.id
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).single()
    if (profile) localStorage.setItem('my_profile_id', profile.id)
    localStorage.setItem('my_user_id', userId)
    router.push('/browse')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="border-b bg-white px-5 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-stone-900">Natiive<span className="text-orange-700">Matrimony</span></Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Welcome back</h1>
          <p className="text-sm text-stone-500 mb-6">Sign in to your account</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Password</label>
              <input className="input" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <button onClick={handleLogin} disabled={loading} className="w-full bg-orange-700 text-white font-semibold py-3 rounded-xl hover:bg-orange-800 disabled:opacity-50 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          <p className="text-center text-sm text-stone-500 mt-6">
            No account? <Link href="/register" className="text-orange-700 font-semibold">Register free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
