import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FFFBF5' }}>
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#7F1D1D"/><path d="M14 5C12.2 8 10 11 10 13.5C10 16.1 11.8 18 14 18.5C16.2 18 18 16.1 18 13.5C18 11 15.8 8 14 5Z" fill="white"/><path d="M9.5 21Q14 23 18.5 21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Native<span style={{ color: '#9B1C1C' }}>Matrimony</span></span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">← Home</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: June 2026</p>

        <div className="space-y-6 text-gray-700">
          {[
            {
              title: '1. Acceptance of terms',
              body: 'By registering on NativeMatrimony, you agree to these Terms of Service. If you do not agree, please do not use the service.',
            },
            {
              title: '2. Eligibility',
              body: 'You must be at least 18 years old and legally eligible to marry under Indian law to use this service. By registering, you confirm that all information you provide is accurate and truthful.',
            },
            {
              title: '3. Prohibited conduct',
              body: 'You may not create fake profiles, impersonate others, send spam, harass other members, or use the service for any commercial purpose. Violation of these rules may result in immediate account termination.',
            },
            {
              title: '4. Profile approval',
              body: 'All profiles are reviewed by our team before becoming visible. We reserve the right to reject or remove any profile that violates our guidelines.',
            },
            {
              title: '5. Premium membership',
              body: 'Founder members receive 1 year of free premium access. After the founding period, premium features are available via paid subscription. Pricing is listed on our Pricing page.',
            },
            {
              title: '6. Limitation of liability',
              body: 'NativeMatrimony is a platform connecting people — we do not conduct background checks or guarantee the accuracy of profiles. We are not responsible for any interactions, meetings, or outcomes between members.',
            },
            {
              title: '7. Governing law',
              body: 'These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana.',
            },
            {
              title: '8. Changes to terms',
              body: 'We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.',
            },
          ].map(s => (
            <section key={s.title}>
              <h2 className="text-base font-bold text-gray-900 mb-1">{s.title}</h2>
              <p className="text-sm leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t text-sm text-gray-400 flex gap-4" style={{ borderColor: '#E5E7EB' }}>
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          <Link href="/" className="underline hover:text-gray-600">Home</Link>
        </div>
      </div>
    </div>
  )
}
