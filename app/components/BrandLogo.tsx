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
          <path d="M16 40C22 29.7 27.1 18.4 30.5 8" fill="none" stroke="#0B7A3E" strokeLinecap="round" strokeWidth="3.2" />
          <path d="M16.6 34.2C12 30.4 9.9 25.9 10.4 20.7C15.6 22.2 18.7 25.8 20 31.6" fill="none" stroke="#23A24D" strokeLinecap="round" strokeWidth="2.4" />
          <path d="M23.1 24.8C29.2 24.1 34.2 26 38 30.7C31.8 31.8 26.8 29.8 23.1 24.8Z" fill="#23A24D" />
          <path d="M31.1 8.2C37.8 11.8 38.7 17.1 33.7 23.8C27 20.2 26.1 14.9 31.1 8.2Z" fill="#F6B91A" stroke="#C98400" strokeWidth="1.15" strokeLinejoin="round" />
          <path d="M26.4 16.7C33 20.2 33.9 25.4 29 31.8C22.4 28.3 21.6 23.2 26.4 16.7Z" fill="#F8C12D" stroke="#C98400" strokeWidth="1.15" strokeLinejoin="round" />
          <path d="M21.6 25.1C27.7 28.5 28.5 33.3 24 39.2C17.9 35.8 17.1 31 21.6 25.1Z" fill="#EFAE19" stroke="#C98400" strokeWidth="1.15" strokeLinejoin="round" />
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
