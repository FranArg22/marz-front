import { createFileRoute } from '@tanstack/react-router'

import { SettingsLayout } from '#/features/identity/settings/SettingsLayout'

export const Route = createFileRoute('/_brand/ajustes')({
  component: SettingsLayout,
})
