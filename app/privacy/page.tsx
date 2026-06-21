import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FBFAF5' }}>
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E7E3D8' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#14241C"/><path d="M14 5C12.2 8 10 11 10 13.5C10 16.1 11.8 18 14 18.5C16.2 18 18 16.1 18 13.5C18 11 15.8 8 14 5Z" fill="white"/><path d="M9.5 21Q14 23 18.5 21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Native<span style={{ color: '#14241C' }}>Matrimony</span></span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">← Home</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          {[
            {
              title: '1. Information we collect',
              body: 'We collect information you provide when creating a profile, including your name, date of birth, phone number, email address, location, education, profession, and photographs. We also collect usage data such as profile views, interests sent, and messages.',
            },
            {
              title: '2. How we use your information',
              body: 'Your information is used to display your profile to potential matches, send you notifications about interests and messages, verify your identity, and improve our service. We do not sell your personal data to third parties.',
            },
            {
              title: '3. Profile visibility',
              body: 'Your profile is visible to other registered members. You can control which fields are visible using the Privacy settings on your profile. Photos are hidden by default until both parties connect.',
            },
            {
              title: '4. Data security',
              body: 'We use Supabase to store your data with industry-standard encryption. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong password and not share your login credentials.',
            },
            {
              title: '5. Data retention',
              body: 'Your data is retained as long as your account is active. You may request deletion of your account and all associated data by contacting us at support@nativematrimony.com.',
            },
            {
              title: '6. Cookies',
              body: 'We use localStorage to store your session. We do not use third-party tracking cookies.',
            },
            {
              title: '7. Contact',
              body: 'For privacy-related queries, contact us at support@nativematrimony.com.',
            },
          ].map(s => (
            <section key={s.title}>
              <h2 className="text-base font-bold text-gray-900 mb-1">{s.title}</h2>
              <p className="text-sm leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t text-sm text-gray-400 flex gap-4" style={{ borderColor: '#E7E3D8' }}>
          <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>
          <Link href="/" className="underline hover:text-gray-600">Home</Link>
        </div>
      </div>
    </div>
  )
}
