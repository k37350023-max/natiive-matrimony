'use client'
import { useState } from 'react'

/* Share a link via WhatsApp (the dominant sharing channel for Indian families)
   or copy it. `url` should be absolute; `text` is the WhatsApp message prefix. */
export default function ShareButtons({ url, text, compact = false }: { url: string; text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — fall back to a prompt so the user can copy manually.
      window.prompt('Copy this link', url)
    }
  }

  return (
    <div className="flex flex-wrap gap-2.5" style={{ justifyContent: compact ? 'flex-start' : 'center' }}>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl font-bold text-sm transition-all"
        style={{ background: '#25D366', color: '#0B3D2E', padding: '11px 18px', minHeight: 44, textDecoration: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.17.19-.34.21-.62.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.08-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38 0 1.41 1.03 2.77 1.17 2.96.14.19 2.02 3.08 4.9 4.32.68.29 1.22.47 1.63.6.69.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12 2a10 10 0 0 0-8.6 15.06L2 22l5.06-1.33A10 10 0 1 0 12 2z"/>
        </svg>
        WhatsApp
      </a>
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-xl font-bold text-sm transition-all"
        style={{ background: 'white', color: '#14241C', border: '1px solid #D8E0D4', padding: '11px 18px', minHeight: 44, cursor: 'pointer' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
