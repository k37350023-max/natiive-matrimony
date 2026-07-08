'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppHeader from '../components/AppHeader'
import MobileNav from '../components/MobileNav'
import { alertChips, alertBrowseHref, type AlertFilters } from '@/lib/alertFilters'

type Alert = {
  id: string
  label: string
  native_place: string | null
  current_location: string | null
  filters: AlertFilters
  created_at: string
}

export default function AlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[] | null>(null)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('my_profile_id')) { router.replace('/login'); return }
    fetch('/api/alerts')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setAlerts(d.alerts) })
      .catch(e => { setError(e.message || 'Could not load alerts'); setAlerts([]) })
  }, [router])

  async function remove(id: string) {
    setRemoving(id)
    const prev = alerts
    setAlerts(a => (a || []).filter(x => x.id !== id))
    try {
      const r = await fetch('/api/alerts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      if (!r.ok) throw new Error()
    } catch {
      setAlerts(prev || [])
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-10" style={{ background: '#FBFAF5' }}>
      <AppHeader />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#14241C' }}>Your alerts</h1>
            <p className="text-sm mt-1" style={{ color: '#5B6B60' }}>
              Get notified when new profiles match a search. Keep as many as you like.
            </p>
          </div>
          <Link href="/browse" className="btn-primary text-sm px-4 py-2 whitespace-nowrap" style={{ textDecoration: 'none' }}>
            + New alert
          </Link>
        </div>

        {error && <p className="text-sm mt-4" style={{ color: '#B4231F' }}>{error}</p>}

        {alerts === null ? (
          <div className="mt-6 space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-3 w-2/3 rounded bg-gray-100 mt-3" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="card mt-6 p-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#EDF3ED' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14241C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: '#14241C' }}>No alerts yet</p>
            <p className="text-sm mt-1 mb-5" style={{ color: '#5B6B60' }}>
              Search by native place and filters, then tap <strong>Save this search</strong> to get notified when matching profiles join.
            </p>
            <Link href="/browse" className="btn-primary text-sm px-5 py-2.5" style={{ textDecoration: 'none' }}>
              Browse profiles
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {alerts.map(a => {
              const np = a.native_place || ''
              const cl = a.current_location || ''
              const chips = alertChips(np, cl, a.filters || {})
              return (
                <div key={a.id} className="card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5" style={{ background: '#EDF3ED', color: '#14241C' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[15px] truncate" style={{ color: '#14241C' }}>{a.label}</p>
                        {chips.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {chips.map((c, i) => (
                              <span key={i} className="text-[11.5px] px-2 py-0.5 rounded-full"
                                style={{ background: '#F1F5EF', color: '#3B4A40', border: '1px solid #E0E8DD' }}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(a.id)}
                      disabled={removing === a.id}
                      aria-label="Remove alert"
                      className="shrink-0 text-sm px-2 py-1 rounded-lg"
                      style={{ color: '#B4231F' }}>
                      {removing === a.id ? '…' : 'Remove'}
                    </button>
                  </div>
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EFEDE4' }}>
                    <Link href={alertBrowseHref(np, cl, a.filters || {})}
                      className="text-sm font-semibold" style={{ color: '#1B5E20', textDecoration: 'none' }}>
                      View matching profiles →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  )
}
