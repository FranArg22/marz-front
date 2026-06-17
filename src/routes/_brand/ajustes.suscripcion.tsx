import { createFileRoute } from '@tanstack/react-router'

import { SubscriptionSection } from '#/features/billing/settings/SubscriptionSection'

export const Route = createFileRoute('/_brand/ajustes/suscripcion')({
  component: SubscriptionSection,
})
