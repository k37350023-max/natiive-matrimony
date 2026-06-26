'use client'

import Link from 'next/link'

export default function PendingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{background: '#FBFAF5'}}>
      <header className="bg-white border-b" style={{borderColor: '#E7E3D8'}}>
        <div className="max-w-xl mx-auto px-5 py-4">
          <Link href="/" className="text-base font-bold text-gray-900 font-serif-display">
            Native<span style={{color: '#14241C'}}>Matrimony</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-serif-display">Profile Created!</h1>
            <p className="text-gray-500 leading-relaxed text-sm">
              Your profile is live in the native-place registry. Start browsing now.
            </p>
          </div>

          <div className="card p-5 mb-4 border-2" style={{ borderColor: '#BBF7D0', background: '#F0FDF4' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#166534' }}>
              Your privacy rules are active
            </p>
            <div className="space-y-2">
              {[
                { icon: '✓', text: 'Search by native place and current location' },
                { icon: '✓', text: 'Send requests without showing contact details' },
                { icon: '✓', text: 'Biodata unlocks only after acceptance' },
                { icon: '✓', text: 'Print biodata for accepted connections' },
              ].map(f => (
                <p key={f.text} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="font-bold" style={{ color: '#2E7D32' }}>{f.icon}</span>
                  {f.text}
                </p>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/browse" className="flex-1 btn-primary text-center py-3">Browse Profiles →</Link>
            <Link href="/interests" className="flex-1 btn-outline text-center py-3">My Requests</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
