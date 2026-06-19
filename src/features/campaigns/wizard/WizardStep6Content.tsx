import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import { BriefPdfDropzone } from './BriefPdfDropzone'
import { useCampaignWizardStore } from './store'

const MIN_GUIDELINES_LENGTH = 50

export function WizardStep6Content() {
  const contentGuidelines = useCampaignWizardStore(
    (state) => state.step6.content_guidelines,
  )
  const setStep6 = useCampaignWizardStore((state) => state.setStep6)
  const trimmedLength = contentGuidelines.trim().length
  const meetsMinimum = trimmedLength >= MIN_GUIDELINES_LENGTH

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          <Trans>Definí los guidelines de contenido</Trans>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          <Trans>
            Escribí las instrucciones que los creadores deberán seguir para
            producir contenido alineado con la campaña.
          </Trans>
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3">
          <label
            htmlFor="content-guidelines"
            className="text-sm font-semibold text-foreground"
          >
            <Trans>Content guidelines</Trans>
          </label>
          <Textarea
            id="content-guidelines"
            value={contentGuidelines}
            aria-invalid={!meetsMinimum}
            onChange={(event) =>
              setStep6({ content_guidelines: event.target.value })
            }
            placeholder={t`Detallá tono, mensajes clave, formato esperado, menciones obligatorias y restricciones.`}
            className="min-h-44 resize-y"
          />
          <p
            className={cn(
              'text-sm',
              meetsMinimum ? 'text-muted-foreground' : 'text-warning',
            )}
          >
            {meetsMinimum ? (
              <Trans>{trimmedLength} caracteres</Trans>
            ) : (
              <Trans>{trimmedLength}/50 mínimo</Trans>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-foreground">
              <Trans>PDF del brief</Trans>
            </h2>
            <p className="text-sm text-muted-foreground">
              <Trans>Podés adjuntar un PDF opcional con más contexto.</Trans>
            </p>
          </div>
          <BriefPdfDropzone />
        </div>
      </div>
    </section>
  )
}
