'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpdate() {
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/browse')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F9FAFB' }}>
      <header className="bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center">
          <Link href="/" className="text-base font-bold text-gray-900 font-serif-display">
            Native<span style={{ color: '#9B1C1C' }}>Matrimony</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 font-serif-display mb-1">Set new password</h2>
            <p className="text-sm text-gray-400 mb-6">Choose a strong password you'll remember.</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="form-label">New password</label>
                <input className="input" type="password" placeholder="Minimum 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Confirm password</label>
                <input className="input" type="password" placeholder="Repeat password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
              </div>
              <button onClick={handleUpdate} disabled={loading} className="btn-primary w-full py-3 text-sm">
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
