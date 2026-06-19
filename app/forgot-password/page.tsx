'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset() {
    if (!email.trim()) { setError('Please enter your email'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) setError(err.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF9' }}>
      <header className="bg-white border-b" style={{ borderColor: '#E8E0D6' }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-stone-900 font-serif-display">
            Natiive<span style={{ color: '#B45309' }}>Matrimony</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            {sent ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#F0FDF4' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="text-lg font-bold text-stone-900 mb-2">Check your inbox</h2>
                <p className="text-sm text-stone-500 mb-6">We sent a password reset link to <strong>{email}</strong>. Check your spam folder if you don't see it.</p>
                <Link href="/login" className="btn-primary w-full py-3 text-sm text-center block">Back to login</Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-stone-900 font-serif-display mb-1">Reset password</h2>
                <p className="text-sm text-stone-400 mb-6">We'll email you a link to reset it.</p>

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
                      onKeyDown={e => e.key === 'Enter' && handleReset()} />
                  </div>
                  <button onClick={handleReset} disabled={loading} className="btn-primary w-full py-3 text-sm">
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </div>

                <p className="text-center text-sm text-stone-400 mt-6">
                  <Link href="/login" className="font-medium" style={{ color: '#B45309' }}>Back to login</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
