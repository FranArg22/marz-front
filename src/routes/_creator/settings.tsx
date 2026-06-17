import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { CreatorSettingsPage } from '#/features/identity/settings/CreatorSettingsPage'

export const settingsSectionSchema = z
  .enum([
    'general',
    'colaboraciones',
    'redes-tarifas',
    'portfolio',
    'billetera',
  ])
  .catch('general')
  .default('general')

export const settingsSearchSchema = z.object({
  section: settingsSectionSchema,
})

export type SettingsSection = z.infer<typeof settingsSectionSchema>

export const Route = createFileRoute('/_creator/settings')({
  validateSearch: settingsSearchSchema,
  component: SettingsRoute,
})

function SettingsRoute() {
  const { section } = Route.useSearch()
  const navigate = useNavigate()

  function handleSectionChange(next: SettingsSection) {
    void navigate({ to: '/settings', search: { section: next }, replace: true })
  }

  return (
    <CreatorSettingsPage
      activeSection={section}
      onSectionChange={handleSectionChange}
    />
  )
}
