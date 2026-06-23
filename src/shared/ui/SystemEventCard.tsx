import type { LucideIcon } from 'lucide-react'
import type { ReactNode, Ref } from 'react'

import { cn } from '#/lib/utils'

export type EventCardTone =
  | 'info'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'neutral'

/**
 * Header variant: `tint` (muted bg + colored kicker text) vs `solid` (full bg
 * + white kicker). Matches the two patterns seen across system-event cards
 * in the .pen — e.g. DraftSubmittedCard uses tint, OfferAcceptedCard uses
 * solid. Sent/Received variants of the same card often share this.
 */
export type EventCardHeaderVariant = 'tint' | 'solid'

const toneBorder: Record<EventCardTone, string> = {
  info: 'border-info/40',
  success: 'border-success/60',
  warning: 'border-warning/60',
  destructive: 'border-destructive/60',
  neutral: 'border-border',
}

const toneHeaderTint: Record<EventCardTone, string> = {
  info: 'bg-muted text-info',
  success: 'bg-muted text-success',
  warning: 'bg-muted text-warning',
  destructive: 'bg-muted text-destructive',
  neutral: 'bg-muted text-foreground',
}

const toneHeaderSolid: Record<EventCardTone, string> = {
  info: 'bg-info text-info-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  neutral: 'bg-foreground text-background',
}

/**
 * Tamaño visual de la card. `compact` se usa en el timeline del chat para que
 * los eventos del sistema (links, borradores, cambios) sean más sutiles y no
 * ocupen casi todo el ancho en mobile. `default` mantiene la card grande para
 * usos fuera del chat (p. ej. detalle de oferta).
 */
export type EventCardSize = 'default' | 'compact'

const sizeStyles: Record<
  EventCardSize,
  {
    container: string
    header: string
    icon: string
    kicker: string
    body: string
  }
> = {
  default: {
    container: 'max-w-[380px] rounded-2xl border-2',
    header: 'gap-2 px-4 py-2.5',
    icon: 'size-4',
    kicker: 'text-xs tracking-widest',
    body: 'p-4',
  },
  compact: {
    container: 'max-w-[300px] rounded-xl border sm:max-w-[340px]',
    header: 'gap-1.5 px-3 py-1.5',
    icon: 'size-3.5',
    kicker: 'text-[10px] tracking-wide',
    body: 'p-3',
  },
}

interface SystemEventCardProps {
  tone: EventCardTone
  kicker: string
  icon: LucideIcon
  headerVariant?: EventCardHeaderVariant
  size?: EventCardSize
  /** Lado del mensaje: 'out' (vos lo enviaste) alinea derecha, 'in' alinea izquierda. */
  side?: 'in' | 'out'
  children: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
}

export function SystemEventCard({
  tone,
  kicker,
  icon: Icon,
  headerVariant = 'tint',
  size = 'default',
  side,
  children,
  className,
  ref,
}: SystemEventCardProps) {
  const header =
    headerVariant === 'solid' ? toneHeaderSolid[tone] : toneHeaderTint[tone]
  const s = sizeStyles[size]
  const card = (
    <div
      ref={ref}
      className={cn(
        '@container w-full overflow-hidden bg-card',
        s.container,
        toneBorder[tone],
        className,
      )}
    >
      <div className={cn('flex items-center', s.header, header)}>
        <Icon className={s.icon} />
        <span className={cn('font-semibold uppercase', s.kicker)}>
          {kicker}
        </span>
      </div>
      <div className={s.body}>{children}</div>
    </div>
  )
  if (!side) return card
  return (
    <div
      className={cn('flex', side === 'out' ? 'justify-end' : 'justify-start')}
    >
      {card}
    </div>
  )
}

/** Key-value tile used inside cards (BUDGET, DEADLINE, etc). */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-xl bg-muted px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}
