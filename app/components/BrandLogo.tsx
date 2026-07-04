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
          <path d="M15 41C12.8 28.4 14.4 17.5 21.8 6.9" fill="none" stroke="#16A13A" strokeLinecap="round" strokeWidth="2.25" />
          <path d="M18.6 41.2C26.5 31 32.6 20.4 38.9 8.9" fill="none" stroke="#12A83A" strokeLinecap="round" strokeWidth="2.35" />
          <path d="M10.4 35.7C9.2 26.6 9.6 19.7 13.3 13.4" fill="none" stroke="#36B84F" strokeLinecap="round" strokeWidth="1.75" />
          <path d="M24.5 38.2C30.7 31.2 36.7 25 43.1 19.1" fill="none" stroke="#23A947" strokeLinecap="round" strokeWidth="1.8" />
          <ellipse cx="20.4" cy="9.4" rx="2.8" ry="5.4" transform="rotate(34 20.4 9.4)" fill="#FFC62C" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="16.4" cy="13.5" rx="2.8" ry="5.4" transform="rotate(-30 16.4 13.5)" fill="#F8B91D" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="21.3" cy="16.1" rx="2.9" ry="5.5" transform="rotate(37 21.3 16.1)" fill="#FFD143" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="16.6" cy="20.3" rx="2.9" ry="5.5" transform="rotate(-32 16.6 20.3)" fill="#F5B319" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="21.3" cy="23.1" rx="3" ry="5.7" transform="rotate(33 21.3 23.1)" fill="#FFC832" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="15.6" cy="27.1" rx="2.9" ry="5.5" transform="rotate(-36 15.6 27.1)" fill="#F3AE17" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="20.6" cy="30.5" rx="3" ry="5.7" transform="rotate(27 20.6 30.5)" fill="#FFC832" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="30.8" cy="13.1" rx="2.9" ry="5.6" transform="rotate(54 30.8 13.1)" fill="#FFD140" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="27.2" cy="17.7" rx="2.9" ry="5.6" transform="rotate(-8 27.2 17.7)" fill="#F8B91D" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="34.2" cy="19.4" rx="2.9" ry="5.6" transform="rotate(60 34.2 19.4)" fill="#FFC832" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="29.4" cy="24.4" rx="3" ry="5.7" transform="rotate(9 29.4 24.4)" fill="#F3AE17" stroke="#D89200" strokeWidth="0.7" />
          <ellipse cx="24.8" cy="29.7" rx="2.9" ry="5.4" transform="rotate(12 24.8 29.7)" fill="#FFC832" stroke="#D89200" strokeWidth="0.7" />
        </svg>
      </span>
      <span className="app-brand-copy">
        <span className="app-brand-native">NATIVE</span>
        <span className="app-brand-matrimony">Matrimony</span>
        {showTagline && <small>Native-place profiles</small>}
      </span>
    </Link>
  )
}
