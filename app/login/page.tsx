'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LaunchBanner from '../components/LaunchBanner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      const userId = data.user.id
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).single()
      if (profile) localStorage.setItem('my_profile_id', profile.id)
      localStorage.setItem('my_user_id', userId)
      router.push('/browse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{background: '#FFFBF5'}}>
      <header className="bg-white border-b px-5 h-14 flex items-center justify-between" style={{borderColor: '#EDE8E0'}}>
        <Link href="/" className="text-lg font-bold text-stone-900 font-serif-display">
          Natiive<span style={{color: '#B45309'}}>Matrimony</span>
        </Link>
        <Link href="/register" className="btn-primary text-sm px-4 py-1.5">Register Free</Link>
      </header>

      <LaunchBanner />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-stone-900 font-serif-display">Welcome back</h1>
            <p className="text-sm text-stone-500 mt-1">Sign in to browse your matches</p>
          </div>

          <div className="card p-7">
            {error && (
              <div className="mb-5 p-3 rounded-lg text-sm font-medium" style={{background: '#FEE2E2', color: '#991B1B'}}>
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="section-label block mb-1.5">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              <div>
                <label className="section-label block mb-1.5">Password</label>
                <input className="input" type="password" placeholder="Your password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              <button onClick={handleLogin} disabled={loading} className="btn-primary w-full py-3 mt-1">
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 mt-5">
            No account?{' '}
            <Link href="/register" className="font-semibold" style={{color: '#B45309'}}>Register free →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
