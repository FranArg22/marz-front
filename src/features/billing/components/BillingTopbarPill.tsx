import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, CircleAlert, Loader2, Info } from 'lucide-react'
import { t, plural } from '@lingui/core/macro'

import { useMe } from '#/shared/api/generated/accounts/accounts'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'

import { useBillingSubscription } from '../hooks/useBillingSubscription'
import type { BillingSubscription } from '../hooks/useBillingSubscription'
import { useCreatePortalSession } from '../hooks/useCreatePortalSession'

const cancelAtFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

type PillState = 'trial_ending' | 'past_due' | 'canceled_pending'

interface PillContent {
  state: PillState
  label: string
  tooltip: string
  className: string
  icon: typeof AlertTriangle
}

export function BillingTopbarPill() {
  const meQuery = useMe()
  const kind =
    meQuery.data?.status === 200 ? meQuery.data.data.kind : undefined

  const subscriptionQuery = useBillingSubscription({
    staleTime: 60_000,
    enabled: kind === 'brand',
  })
  const portalMutation = useCreatePortalSession()
  const navigate = useNavigate()

  if (kind !== 'brand') return null
  if (subscriptionQuery.isLoading) return null
  if (subscriptionQuery.isError) return null

  const response = subscriptionQuery.data
  if (!response || response.status !== 200) return null
  const sub = response.data

  const content = resolvePillContent(sub)
  if (!content) return null

  const openPortal = () => {
    portalMutation.mutate(
      { data: { return_url: window.location.href } },
      {
        onSuccess: (portalResponse) => {
          if (portalResponse.status === 201) {
            window.location.assign(portalResponse.data.portal_url)
          }
        },
      },
    )
  }

  const triggerPillAction = () => {
    if (content.state === 'canceled_pending') {
      void navigate({ to: '/billing' })
      return
    }
    openPortal()
  }

  const isPending = portalMutation.isPending
  const Icon = content.icon

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={triggerPillAction}
            disabled={isPending}
            aria-label={content.label}
            data-pill-state={content.state}
            className={cn(
              'inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
              content.className,
            )}
          >
            {isPending ? (
              <Loader2
                aria-hidden="true"
                className="size-4 shrink-0 animate-spin"
              />
            ) : (
              <Icon aria-hidden="true" className="size-4 shrink-0" />
            )}
            <span className="truncate">{content.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{content.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function resolvePillContent(sub: BillingSubscription): PillContent | null {
  if (
    sub.in_trial &&
    sub.days_until_trial_ends != null &&
    sub.days_until_trial_ends <= 2
  ) {
    const days = sub.days_until_trial_ends
    const label = plural(days, {
      one: 'Tu trial termina en # día',
      other: 'Tu trial termina en # días',
    })
    return {
      state: 'trial_ending',
      label,
      tooltip: t`Actualizá tu método de pago antes de que termine el trial para evitar interrupciones.`,
      className: 'bg-warning/10 text-warning hover:bg-warning/15',
      icon: AlertTriangle,
    }
  }

  if (sub.status === 'past_due') {
    return {
      state: 'past_due',
      label: t`Tu cobro falló — actualizá la tarjeta`,
      tooltip: t`Hubo un problema con el último cobro. Abrí el portal para actualizar la tarjeta.`,
      className:
        'bg-destructive/10 text-destructive hover:bg-destructive/15',
      icon: CircleAlert,
    }
  }

  if (sub.status === 'canceled' && sub.cancel_at != null) {
    const formattedDate = cancelAtFormatter.format(new Date(sub.cancel_at))
    return {
      state: 'canceled_pending',
      label: t`Cancelaste — acceso hasta ${formattedDate}`,
      tooltip: t`Tu suscripción está cancelada. Mantenés acceso hasta el ${formattedDate}.`,
      className: 'bg-info/10 text-info hover:bg-info/15',
      icon: Info,
    }
  }

  return null
}
