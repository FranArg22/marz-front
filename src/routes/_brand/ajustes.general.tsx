import { createFileRoute } from '@tanstack/react-router'

import { BrandGeneralSection } from '#/features/identity/settings/BrandGeneralSection'

export const Route = createFileRoute('/_brand/ajustes/general')({
  component: BrandGeneralSection,
})
