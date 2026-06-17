import { createFileRoute } from '@tanstack/react-router'

import { GeneralSection } from '#/features/identity/settings/GeneralSection'

export const Route = createFileRoute('/_brand/ajustes/general')({
  component: GeneralSection,
})
