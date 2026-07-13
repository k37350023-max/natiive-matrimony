import Link from 'next/link'
import type { ReactNode } from 'react'

type EmptyStateAction = { label: string; href?: string; onClick?: () => void }

function EmptyStateButton({ action, kind }: { action: EmptyStateAction; kind: 'primary' | 'ghost' }) {
  const cls = kind === 'primary' ? 'btn-primary' : 'btn-ghost'
  const style = {
    minHeight: 46,
    padding: '0 22px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    textDecoration: 'none',
  } as const
  if (action.href) return <Link href={action.href} className={cls} style={style}>{action.label}</Link>
  return <button onClick={action.onClick} className={cls} style={style}>{action.label}</button>
}

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
  primary?: EmptyStateAction
  secondary?: EmptyStateAction
  compact?: boolean
}) {
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
            {primary && <EmptyStateButton action={primary} kind="primary" />}
            {secondary && <EmptyStateButton action={secondary} kind="ghost" />}
          </div>
        )}
      </div>
    </div>
  )
}
