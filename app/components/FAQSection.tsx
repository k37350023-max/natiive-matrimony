'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Is NativeMatrimony only for Telugu people?',
    a: 'Yes — we are built specifically for Telugu families across Telangana, Andhra Pradesh, and the Telugu diaspora worldwide. Our filters, community understanding, and focus are all Telugu-first.',
  },
  {
    q: 'What does "native place first" mean?',
    a: 'Native place is the primary way people browse and match on our platform. You can filter by state, district, and even specific native villages. Many Telugu families consider native place compatibility very important.',
  },
  {
    q: 'Is the service free?',
    a: 'Yes — the first 1,000 members get full premium access free for one year. After that, premium plans start at ₹999/month. You can always browse and receive interests for free.',
  },
  {
    q: 'How private are my photos and contact details?',
    a: 'Completely private by default. Your photo is shown only after both parties accept an interest. Phone numbers and email are shared only after a mutual match. You control what\'s visible at every step.',
  },
  {
    q: 'Can parents register on behalf of their child?',
    a: 'Yes. During registration, select "Profile managed by: Parent / Guardian". Your child can later take over the profile. This is common and fully supported.',
  },
  {
    q: 'How is NativeMatrimony different from other matrimony sites?',
    a: 'We focus on native place as the primary match dimension, not just religion or caste. We have a simpler, cleaner experience with no spam, no cold messages, and no contact sharing until both sides agree.',
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
