import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Megaphone, Video } from 'lucide-react'

import { cn } from '#/lib/utils'
import { useCampaignWizardStore } from './store'

export function WizardStep1ContentType() {
  const contentType = useCampaignWizardStore(
    (state) => state.step1.content_type,
  )
  const setStep1 = useCampaignWizardStore((state) => state.setStep1)
  const influencerPostsSelected = contentType === 'influencer_posts'

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          <Trans>Elegí el tipo de contenido</Trans>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          <Trans>Seleccioná el formato principal de la campaña.</Trans>
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={t`Tipo de contenido`}
        className="grid gap-4 md:grid-cols-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={influencerPostsSelected}
          onClick={() => setStep1({ content_type: 'influencer_posts' })}
          className={cn(
            'flex min-h-44 flex-col items-start gap-4 rounded-lg border bg-card p-5 text-left transition-colors',
            influencerPostsSelected
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:bg-surface-hover',
          )}
        >
          <span
            className={cn(
              'flex size-10 items-center justify-center rounded-md',
              influencerPostsSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
            )}
          >
            <Megaphone aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-base font-semibold text-foreground">
              <Trans>Influencers Posts</Trans>
            </span>
            <span className="text-sm text-muted-foreground">
              <Trans>
                Publicaciones creadas por influencers en sus canales.
              </Trans>
            </span>
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked="false"
          disabled
          className="flex min-h-44 cursor-not-allowed flex-col items-start gap-4 rounded-lg border border-border bg-card p-5 text-left opacity-70"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Video aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-3">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-foreground">
                <Trans>UGC Videos</Trans>
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Trans>Próximamente</Trans>
              </span>
            </span>
            <span className="text-sm text-muted-foreground">
              <Trans>
                Videos generados por creadores para reutilización de marca.
              </Trans>
            </span>
          </span>
        </button>
      </div>
    </section>
  )
}
