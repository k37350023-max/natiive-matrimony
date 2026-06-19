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
    if (!email.trim() || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')
    // Clear any stale session from a previous user before setting new one
    localStorage.removeItem('my_profile_id')
    localStorage.removeItem('my_user_id')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      const userId = data.user.id
      localStorage.setItem('my_user_id', userId)
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).maybeSingle()
      if (profile) {
        localStorage.setItem('my_profile_id', profile.id)
        supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', profile.id)
      }
      router.push('/browse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF9' }}>
      <header className="bg-white border-b" style={{ borderColor: '#E8E0D6' }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-stone-900 font-serif-display">
            Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
          </Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-1.5">Register Free</Link>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left — desktop value prop */}
        <div className="hidden lg:flex flex-col justify-center px-16 flex-1" style={{ background: 'white', borderRight: '1px solid #E8E0D6' }}>
          <div className="max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#B45309' }}>NatiiveMatrimony</p>
            <h2 className="font-serif-display text-3xl font-bold text-stone-900 leading-snug mb-6">
              Find your match from<br />your native place
            </h2>
            <div className="space-y-5">
              {[
                { title: 'Native place first', desc: 'We match by your district and region — not just age and profession.' },
                { title: 'Privacy by design', desc: 'Photos and contact details unlock only after both parties accept.' },
                { title: 'Free until Sept 2026', desc: 'Full access to every feature. No credit card required.' },
              ].map(f => (
                <div key={f.title} className="flex gap-3.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#FEF9EC' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{f.title}</p>
                    <p className="text-sm text-stone-400 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — login form */}
        <div className="flex-1 flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-stone-900 font-serif-display">Welcome back</h1>
              <p className="text-sm text-stone-500 mt-1">Sign in to browse your matches</p>
            </div>

            <div className="card p-6">
              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="form-label">Email address</label>
                  <input className="input" type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Password</label>
                    <Link href="/forgot-password" className="text-xs font-medium" style={{ color: '#B45309' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <input className="input" type="password" placeholder="Your password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <button onClick={handleLogin} disabled={loading} className="btn-primary w-full py-3 text-sm">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-stone-500 mt-5">
              No account yet?{' '}
              <Link href="/register" className="font-semibold" style={{ color: '#B45309' }}>Register free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
