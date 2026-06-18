'use client'
import Link from 'next/link'

export default function LaunchBanner() {
  return (
    <div className="border-b py-2.5 px-4" style={{ background: '#052E16', borderColor: '#166534' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center">
        <span className="text-xs font-bold" style={{ color: '#4ADE80' }}>
          🎉 LAUNCH OFFER
        </span>
        <span className="text-xs text-white font-medium">
          All premium features FREE until <span className="font-bold" style={{ color: '#86EFAC' }}>30 September 2026</span>
          <span className="mx-2 opacity-40">·</span>
          No credit card. No subscription. No hidden fees.
        </span>
        <Link href="/register"
          className="text-xs font-bold px-3 py-1 rounded-full shrink-0"
          style={{ background: '#16A34A', color: 'white' }}>
          Register Free →
        </Link>
      </div>
    </div>
  )
}
