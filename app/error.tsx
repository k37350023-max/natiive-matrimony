'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {}, [error])
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#F8F7F5' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Something went wrong</h1>
        <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '0 0 24px', lineHeight: 1.6 }}>We hit an unexpected error. Please try again or go back home.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={reset} className="btn-primary" style={{ padding: '11px 22px', fontSize: '14px' }}>Try again</button>
          <Link href="/" className="btn-ghost" style={{ padding: '11px 22px', fontSize: '14px' }}>Go home</Link>
        </div>
      </div>
    </div>
  )
}
