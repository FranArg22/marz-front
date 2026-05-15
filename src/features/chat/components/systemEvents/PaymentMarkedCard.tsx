import { t } from '@lingui/core/macro'
import { useEffect, useMemo, useRef } from 'react'
import { CircleDollarSign } from 'lucide-react'

import type { MessageItem } from '#/features/chat/types'
import { trackCardSeen } from '#/shared/analytics/paymentCardSeen'
import { SystemEventCard } from '#/shared/ui/SystemEventCard'

import {
  extractPaymentMarkedSnapshotV3,
  formatPlatforms,
  formatSnapshotAmount,
  formatSnapshotDate,
} from './offerEventCardUtils'

interface PaymentMarkedCardProps {
  message: MessageItem
  viewer: { kind: 'brand' | 'creator' | undefined }
  highlighted?: boolean
}

export function PaymentMarkedCard({
  message,
  viewer,
  highlighted = false,
}: PaymentMarkedCardProps) {
  const snapshot = useMemo(
    () => extractPaymentMarkedSnapshotV3(message.payload),
    [message.payload],
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (
      !snapshot?.declaredPaymentId ||
      viewer.kind !== 'creator' ||
      hasFiredRef.current ||
      !cardRef.current
    ) {
      return
    }

    const declaredPaymentId = snapshot.declaredPaymentId

    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting)
      if (!isVisible || hasFiredRef.current) return

      hasFiredRef.current = true
      trackCardSeen({ declared_payment_id: declaredPaymentId })
      observer.disconnect()
    })

    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [snapshot, viewer.kind])

  if (!snapshot) return null

  const side = viewer.kind === 'brand' ? 'out' : 'in'
  const formattedAmount = formatSnapshotAmount(
    snapshot.amount,
    snapshot.currency,
  )
  const deliverablesCount = snapshot.deliverablesCount

  return (
    <article
      ref={cardRef}
      role="article"
      aria-label={t`Pago marcado`}
      className={`flex py-1 ${side === 'out' ? 'justify-end' : 'justify-start'}`}
      data-testid="payment-marked-card"
      data-highlighted={highlighted ? 'true' : undefined}
    >
      <SystemEventCard
        tone="success"
        kicker={t`Pago marcado`}
        icon={CircleDollarSign}
        headerVariant="solid"
        className={
          highlighted
            ? 'border-ring bg-accent/40 shadow-[0_0_0_3px_var(--ring)]'
            : undefined
        }
      >
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {t`Pago de ${formattedAmount} marcado.`}
          </p>
          <dl className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
            <div className="rounded-xl bg-muted px-3 py-2">
              <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t`Plataformas`}
              </dt>
              <dd className="mt-0.5 font-semibold">
                {formatPlatforms(snapshot.platforms)}
              </dd>
            </div>
            <div className="rounded-xl bg-muted px-3 py-2">
              <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t`Entregables`}
              </dt>
              <dd className="mt-0.5 font-semibold">{deliverablesCount}</dd>
            </div>
            <div className="rounded-xl bg-muted px-3 py-2 sm:col-span-2">
              <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t`Fecha`}
              </dt>
              <dd className="mt-0.5 font-semibold">
                <time dateTime={snapshot.declaredAt}>
                  {formatSnapshotDate(snapshot.declaredAt)}
                </time>
              </dd>
            </div>
          </dl>
        </div>
      </SystemEventCard>
    </article>
  )
}
