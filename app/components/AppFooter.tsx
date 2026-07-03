'use client'

import Link from 'next/link'

export default function AppFooter() {
  return (
    <footer style={{ borderTop: '1px solid #E7E3D8', padding: '32px 20px 24px', marginTop: '40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
          © 2026 <span style={{ fontWeight: 600, color: '#334155' }}>NativeMatrimony.com</span> · Built for Telugu families
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {[
            { label: 'Browse', href: '/browse' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'support@nativematrimony.com', href: 'mailto:support@nativematrimony.com' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              style={{ minHeight: '36px', display: 'inline-flex', alignItems: 'center', padding: '0 8px', fontSize: '12px', color: '#94A3B8', textDecoration: 'none', borderRadius: '8px' }}
              onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = '#5E6B62')}
              onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = '#94A3B8')}>
              {l.label}
            </Link>
          ))}
        </div>
        <p style={{ flexBasis: '100%', fontSize: '11px', lineHeight: 1.6, color: '#94A3B8', margin: '10px 0 0' }}>
          NativeMatrimony.com is an independent platform and has no affiliation with Matrimony.com Limited or any of its subsidiaries.
        </p>
      </div>
    </footer>
  )
}
