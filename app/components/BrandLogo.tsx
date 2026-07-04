import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  className?: string
  showTagline?: boolean
}

export default function BrandLogo({ href = '/', className = '', showTagline = true }: BrandLogoProps) {
  return (
    <Link href={href} className={`app-brand ${className}`.trim()} aria-label="NativeMatrimony home">
      <span className="app-brand-mark app-brand-paddy-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img" focusable="false">
          <path d="M16 41C20.8 31.4 25.5 21.7 29 8" fill="none" stroke="#138F35" strokeLinecap="round" strokeWidth="3" />
          <path d="M18.2 34.5C13 30.4 10.4 25.8 10.4 20.5C15.8 22.2 19.1 26.1 20.4 32.2" fill="none" stroke="#20A849" strokeLinecap="round" strokeWidth="2.2" />
          <path d="M23.8 24.4C30.4 24 35.2 26.2 38.2 31C31.9 31.7 27.2 29.7 23.8 24.4Z" fill="#21A64A" opacity="0.95" />
          <ellipse cx="29.2" cy="9.4" rx="4.1" ry="7.1" transform="rotate(28 29.2 9.4)" fill="#FFC329" stroke="#D99000" strokeWidth="0.9" />
          <ellipse cx="25.4" cy="15.1" rx="4.2" ry="7.2" transform="rotate(31 25.4 15.1)" fill="#F7B51B" stroke="#D99000" strokeWidth="0.9" />
          <ellipse cx="22.3" cy="21.3" rx="4.1" ry="7.1" transform="rotate(28 22.3 21.3)" fill="#FFC329" stroke="#D99000" strokeWidth="0.9" />
          <ellipse cx="19.5" cy="27.6" rx="3.9" ry="6.8" transform="rotate(25 19.5 27.6)" fill="#F3AC18" stroke="#D99000" strokeWidth="0.9" />
        </svg>
      </span>
      <span className="app-brand-copy">
        <span className="app-brand-native">NATIVE</span>
        <span className="app-brand-matrimony">Matrimony</span>
        {showTagline && <small>Native profiles</small>}
      </span>
    </Link>
  )
}
