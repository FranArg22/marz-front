import { t } from '@lingui/core/macro'
import type React from 'react'

import { useGetMyCreatorSettings } from '#/shared/api/generated/creator/creator'
import type { CreatorSettingsResponse } from '#/shared/api/generated/model'
import type { SettingsSection } from '#/routes/_creator/settings'

import { CollaborationSection } from './CollaborationSection'
import { GeneralSection } from './GeneralSection'
import { PortfolioSection } from './PortfolioSection'
import { RatesSection } from './RatesSection'
import { SectionSaveBar } from './SectionSaveBar'
import { SettingsSidebar } from './SettingsSidebar'

interface CreatorSettingsPageProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}

export function CreatorSettingsPage({
  activeSection,
  onSectionChange,
}: CreatorSettingsPageProps) {
  const settingsQuery = useGetMyCreatorSettings()
  const settingsResponse = settingsQuery.data

  let content: React.ReactNode

  if (settingsQuery.isPending) {
    content = <SettingsSkeleton />
  } else if (settingsQuery.isError) {
    content = <SettingsErrorBanner />
  } else if (!settingsResponse || settingsResponse.status !== 200) {
    content = <SettingsErrorBanner />
  } else {
    content = renderSection(activeSection, settingsResponse.data)
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)] flex-col bg-background md:flex-row">
      <SettingsSidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-6 md:px-8 md:py-8">
          {content}
        </div>
      </main>
    </div>
  )
}

function renderSection(
  section: SettingsSection,
  data: CreatorSettingsResponse,
): React.ReactNode {
  if (section === 'colaboraciones') return <CollaborationSection data={data} />
  if (section === 'redes-tarifas') return <RatesSection data={data} />
  if (section === 'portfolio') return <PortfolioSection data={data} />
  if (section === 'billetera') return <WalletSection />
  return <GeneralSection data={data} />
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6" aria-label={t`Cargando ajustes`}>
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-md bg-muted" />
        <div className="h-20 animate-pulse rounded-md bg-muted" />
        <div className="h-20 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  )
}

function SettingsErrorBanner() {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {t`No pudimos cargar tus ajustes. Intentá nuevamente en unos minutos.`}
    </div>
  )
}

function SectionFrame({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <section className="flex min-h-full flex-col">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <div className="mt-6 flex-1">{children}</div>
      <SectionSaveBar
        isDirty={false}
        isSubmitting={false}
        error={null}
        onSave={() => {}}
      />
    </section>
  )
}

function WalletSection() {
  return <SectionFrame title={t`Billetera`} />
}
