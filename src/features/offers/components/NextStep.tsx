import {
  CheckCircle2,
  CircleDollarSign,
  Eye,
  Hourglass,
  Link as LinkIcon,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '@lingui/core/macro'

import type { OfferDetailDTO } from '#/features/offers/hooks/useConversationOffers'
import type { DeliverableDTO } from '#/features/deliverables/types'

interface NextStepProps {
  offer: OfferDetailDTO | null
  sessionKind: 'brand' | 'creator'
  deliverables?: DeliverableDTO[]
  // Paid plans auto-close on link approval (settled via Stripe), so the brand
  // never performs a manual "mark as paid" step. Free plans still do.
  isFreePlan?: boolean
}

// Sistema de tonos:
// - action  (azul)    = tenés que hacer algo
// - waiting (amarillo) = estás esperando que el otro haga algo
// - success (verde)    = algo correcto / completado
// - error   (rojo)     = algo rechazado
type NextStepTone = 'action' | 'waiting' | 'success' | 'error'

interface NextStepMeta {
  label: string
  tone: NextStepTone
  icon: LucideIcon
}

function deriveDeliverableStep(
  deliverable: DeliverableDTO | undefined,
  sessionKind: 'brand' | 'creator',
  isFreePlan: boolean,
): NextStepMeta | null {
  if (!deliverable) return null

  switch (deliverable.status) {
    case 'pending':
    case 'draft_submitted':
      // pending = creator tiene que subir / draft_submitted = brand tiene que revisar
      if (deliverable.status === 'draft_submitted') {
        return sessionKind === 'brand'
          ? {
              label: t`Tenés un video borrador para revisar`,
              tone: 'action',
              icon: Eye,
            }
          : {
              label: t`Esperando aprobación del video borrador`,
              tone: 'waiting',
              icon: Hourglass,
            }
      }
      return sessionKind === 'creator'
        ? {
            label: t`Tenés que subir el video borrador`,
            tone: 'action',
            icon: Upload,
          }
        : {
            label: t`Esperando que el creador suba el video borrador`,
            tone: 'waiting',
            icon: Hourglass,
          }
    case 'changes_requested':
      return sessionKind === 'creator'
        ? {
            label: t`Tenés cambios para aplicar`,
            tone: 'error',
            icon: Upload,
          }
        : {
            label: t`Esperando los cambios del creator`,
            tone: 'waiting',
            icon: Hourglass,
          }
    case 'draft_approved':
      return sessionKind === 'creator'
        ? {
            label: t`Tenés que publicar el link`,
            tone: 'action',
            icon: LinkIcon,
          }
        : {
            label: t`Esperando que el creator publique el link`,
            tone: 'waiting',
            icon: Hourglass,
          }
    case 'link_submitted':
      return sessionKind === 'brand'
        ? { label: t`Tenés un link para revisar`, tone: 'action', icon: Eye }
        : {
            label: t`Esperando aprobación del link`,
            tone: 'waiting',
            icon: Hourglass,
          }
    case 'link_approved':
    case 'completed':
      if (sessionKind === 'brand') {
        // Paid plans settle automatically; no manual mark-as-paid prompt.
        return isFreePlan
          ? {
              label: t`Tenés que marcar como pagado`,
              tone: 'action',
              icon: CircleDollarSign,
            }
          : {
              label: t`Procesando el pago`,
              tone: 'waiting',
              icon: Hourglass,
            }
      }
      return {
        label: t`Esperando el pago`,
        tone: 'waiting',
        icon: Hourglass,
      }
    case 'paid':
      return {
        label: t`Entregable completado`,
        tone: 'success',
        icon: CheckCircle2,
      }
    default:
      return null
  }
}

function getNextStepMeta(
  offer: OfferDetailDTO,
  sessionKind: 'brand' | 'creator',
  deliverables: DeliverableDTO[],
  isFreePlan: boolean,
): NextStepMeta | null {
  if (offer.status === 'sent') {
    return sessionKind === 'creator'
      ? {
          label: t`Tenés una oferta para revisar`,
          tone: 'action',
          icon: Eye,
        }
      : {
          label: t`El creador está analizando la oferta`,
          tone: 'waiting',
          icon: Hourglass,
        }
  }

  if (offer.status === 'rejected') {
    return {
      label: t`Oferta rechazada`,
      tone: 'error',
      icon: Hourglass,
    }
  }

  if (offer.status === 'expired') {
    return {
      label: t`Oferta expirada`,
      tone: 'error',
      icon: Hourglass,
    }
  }

  if (offer.status === 'cancelled') {
    return {
      label: t`Oferta cancelada`,
      tone: 'error',
      icon: Hourglass,
    }
  }

  // Oferta aceptada: el "next step" sale del primer deliverable que no esté completo.
  const active = deliverables.find((d) => d.status !== 'paid')
  if (!active) {
    return {
      label: t`Oferta completada`,
      tone: 'success',
      icon: CheckCircle2,
    }
  }
  return deriveDeliverableStep(active, sessionKind, isFreePlan)
}

const EMPTY_DELIVERABLES: DeliverableDTO[] = []

/* eslint-disable lingui/no-unlocalized-strings -- Tailwind class map is not translatable UI copy. */
const toneClass: Record<NextStepTone, string> = {
  action: 'bg-info/10 text-info',
  waiting: 'bg-warning/15 text-warning',
  success: 'bg-success/10 text-success',
  error: 'bg-destructive/10 text-destructive',
}
/* eslint-enable lingui/no-unlocalized-strings */

export function NextStep({
  offer,
  sessionKind,
  deliverables = EMPTY_DELIVERABLES,
  isFreePlan = true,
}: NextStepProps) {
  if (!offer) return null

  const meta = getNextStepMeta(offer, sessionKind, deliverables, isFreePlan)
  if (!meta) return null

  const Icon = meta.icon

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${toneClass[meta.tone]}`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{meta.label}</span>
    </div>
  )
}
