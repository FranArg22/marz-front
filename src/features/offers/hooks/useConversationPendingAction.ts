import { useConversationOffersPaginated } from '#/features/offers/hooks/useConversationOffers'
import { useGetConversationDeliverablesQuery } from '#/features/deliverables/api/conversationDeliverables'
import { useMe } from '#/shared/api/generated/accounts/accounts'
import { getWorkspacePlan } from '#/features/offers/utils/workspacePlan'
import { getNextStepMeta } from '#/features/offers/components/NextStep'

/**
 * Indica si la conversación tiene una acción pendiente del lado del usuario
 * actual (oferta para revisar, borrador para subir/aprobar, link para publicar,
 * marcar como pagado, etc.). Reusa la lógica de `NextStep` (tono `action`) y los
 * datos de ofertas/entregables que el panel ya tiene cacheados.
 */
export function useConversationPendingAction(
  conversationId: string,
  sessionKind: 'brand' | 'creator' | undefined,
): boolean {
  const { current } = useConversationOffersPaginated(conversationId)
  const deliverablesQuery = useGetConversationDeliverablesQuery(conversationId)
  const meQuery = useMe()

  if (!sessionKind || !current) return false

  const isFreePlan =
    getWorkspacePlan(
      meQuery.data?.status === 200
        ? meQuery.data.data.brand_workspace?.plan
        : undefined,
    ) === 'free'

  const deliverables = (deliverablesQuery.data?.deliverables ?? []).filter(
    (deliverable) => deliverable.offer_id === current.id,
  )

  const meta = getNextStepMeta(current, sessionKind, deliverables, isFreePlan)
  return meta?.tone === 'action'
}
