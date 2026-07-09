import Link from 'next/link'
import type { ReactNode } from 'react'

/* One consistent, premium empty state across the app: a soft gradient card,
   a dark icon tile, a clear headline, guidance, and always a next action so a
   page never dead-ends into blank space. */
export default function EmptyState({
  icon,
  title,
  subtitle,
  primary,
  secondary,
  compact = false,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  primary?: { label: string; href?: string; onClick?: () => void }
  secondary?: { label: string; href?: string; onClick?: () => void }
  compact?: boolean
}) {
  const Btn = ({ a, kind }: { a: { label: string; href?: string; onClick?: () => void }; kind: 'primary' | 'ghost' }) => {
    const cls = kind === 'primary' ? 'btn-primary' : 'btn-ghost'
    const style = { minHeight: 46, padding: '0 22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'none' } as const
    if (a.href) return <Link href={a.href} className={cls} style={style}>{a.label}</Link>
    return <button onClick={a.onClick} className={cls} style={style}>{a.label}</button>
  }

  return (
    <div className="card overflow-hidden">
      <div className={`text-center ${compact ? 'px-5 py-8' : 'px-6 py-12'}`}
        style={{ background: 'linear-gradient(180deg, #F4F8F2 0%, #FFFFFF 72%)' }}>
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#14241C', color: '#EAF3EA' }}>
          {icon}
        </div>
        <h2 className="font-bold" style={{ fontSize: 18, color: '#14241C' }}>{title}</h2>
        <p className="text-sm mt-1.5 mx-auto leading-relaxed" style={{ color: '#5B6B60', maxWidth: 360 }}>{subtitle}</p>
        {(primary || secondary) && (
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-5">
            {primary && <Btn a={primary} kind="primary" />}
            {secondary && <Btn a={secondary} kind="ghost" />}
          </div>
        )}
      </div>
    </div>
  )
}
