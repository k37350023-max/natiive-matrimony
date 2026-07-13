import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  className?: string
  showTagline?: boolean
}

export default function BrandLogo({ href = '/', className = '', showTagline = true }: BrandLogoProps) {
  return (
    <Link href={href} className={`app-brand ${className}`.trim()} aria-label="Native Matrimony home">
      <span className="app-brand-mark app-brand-emblem" aria-hidden="true">
        <img src="/native-matrimony-emblem-160.webp" alt="" />
      </span>
      <span className="app-brand-copy">
        <span className="app-brand-native">Native</span>
        <span className="app-brand-matrimony">Matrimony</span>
        {showTagline && <small>Rooted in tradition. United in love.</small>}
      </span>
    </Link>
  )
}
