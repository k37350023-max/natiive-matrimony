import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#FBFAF5' }}>
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <p className="font-serif-display" style={{ fontSize: '100px', fontWeight: 700, color: '#E7E3D8', lineHeight: 1, margin: '0 0 20px' }}>404</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Page not found</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 28px', lineHeight: 1.6 }}>This page doesn&apos;t exist or was moved.</p>
        <Link href="/" className="btn-primary" style={{ padding: '12px 28px', fontSize: '14px' }}>Go home</Link>
      </div>
    </div>
  )
}
