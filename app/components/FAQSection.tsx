'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Is NativeMatrimony only for one community?',
    a: 'No. The product is built around native-place matching. We may launch community by community so each place has useful profile liquidity instead of feeling empty.',
  },
  {
    q: 'What does "native place first" mean?',
    a: 'Native place is the primary way people browse and match on our platform. You can filter by state, district, and specific native places, then save alerts when a place is still growing.',
  },
  {
    q: 'Is the service free?',
    a: 'Yes. Create a profile, browse by native place, send requests, and see details after both sides accept. Optional guided matchmaking can become a premium service for families who want human help.',
  },
  {
    q: 'How private are my photos and contact details?',
    a: 'Photos are visible by default so profiles feel real, but you can hide your photo anytime from Privacy settings. Phone numbers and email are shared only after both sides accept. You control what stays private.',
  },
  {
    q: 'Can parents register on behalf of their child?',
    a: 'Yes. During registration, select "Profile managed by: Parent / Guardian". Your child can later take over the profile. This is common and fully supported.',
  },
  {
    q: 'How is NativeMatrimony different from other matrimony sites?',
    a: 'We are not trying to be a broad listing site. We focus on native-place discovery, useful profile previews, join alerts for growing places, no cold messages, and contact sharing only after both sides agree.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section style={{ maxWidth: '720px', margin: '0 auto 80px', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <p style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#14241C', margin: '0 0 10px' }}>Common questions</p>
        <h2 className="font-serif-display" style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 700, color: '#0F0F0F', letterSpacing: '-0.02em', margin: 0 }}>
          Frequently asked
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '14px', border: `1px solid ${open === i ? '#CADFCA' : 'rgba(0,0,0,0.06)'}`, overflow: 'hidden', transition: 'border-color 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '12px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 600, color: open === i ? '#14241C' : '#14241C', lineHeight: 1.4 }}>{faq.q}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={open === i ? '#14241C' : '#94A3B8'} strokeWidth="2.5" style={{ flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {open === i && (
              <div style={{ padding: '0 20px 18px' }}>
                <p style={{ fontSize: '13.5px', color: '#5E6B62', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
