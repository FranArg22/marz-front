import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Edit3 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import type { CreateCampaignRequest } from '#/shared/api/generated/model'
import { useCampaignWizardStore } from './store'
import type { CampaignWizardState } from './store'

interface WizardStep7ReviewProps {
  onEditStep: (step: number) => void
}

interface ReviewBlock {
  title: string
  editStep: number
  rows: Array<{ label: string; value: string }>
}

export function WizardStep7Review({ onEditStep }: WizardStep7ReviewProps) {
  const state = useCampaignWizardStore()
  const blocks = buildReviewBlocks(state)

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          <Trans>Revisá la campaña</Trans>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          <Trans>
            Confirmá los datos antes de crear la campaña. Podés editar cada
            bloque desde su paso correspondiente.
          </Trans>
        </p>
      </div>

      <div className="grid gap-4">
        {blocks.map((block) => (
          <article
            key={block.title}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-foreground">
                  {block.title}
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditStep(block.editStep)}
              >
                <Edit3 aria-hidden="true" className="size-4" />
                <Trans>Editar</Trans>
              </Button>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {block.rows.map((row) => (
                <div key={row.label} className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="text-sm text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

export function buildCreateCampaignRequest(
  state: CampaignWizardState,
): CreateCampaignRequest | null {
  const { step1, step2, step3, step4, step5, step6 } = state

  if (
    step1.content_type === null ||
    step2.pricing_model === null ||
    step3.name.trim() === '' ||
    step3.description.trim() === '' ||
    step3.imageS3Key === null ||
    step4.platforms.length === 0 ||
    step4.interests.length === 0 ||
    step4.creator_country === null ||
    step4.min_creator_tier_slug === null ||
    step5.compensation_type === null ||
    step6.content_guidelines.trim().length < 50
  ) {
    return null
  }

  return {
    content_type: step1.content_type,
    pricing_model: step2.pricing_model,
    name: step3.name.trim(),
    description: step3.description.trim(),
    target_url: step3.target_url.trim(),
    image_s3_key: step3.imageS3Key,
    platforms: step4.platforms,
    interests: step4.interests,
    creator_country: step4.creator_country,
    min_creator_tier_slug: step4.min_creator_tier_slug,
    compensation_type: step5.compensation_type,
    compensation_notes: step5.compensation_notes.trim() || null,
    video_reuse_permission_default: step5.video_reuse_permission_default,
    content_guidelines: step6.content_guidelines.trim(),
    brief_pdf_s3_key: step6.briefPdfS3Key,
  }
}

export function buildReviewBlocks(state: CampaignWizardState): ReviewBlock[] {
  const { step1, step2, step3, step4, step5, step6 } = state
  const missingValue = t`Sin completar`

  return [
    {
      title: t`Tipo de campaña`,
      editStep: 1,
      rows: [
        {
          label: t`Tipo de contenido`,
          value: formatContentType(step1.content_type, missingValue),
        },
        {
          label: t`Modelo de pricing`,
          value: formatPricingModel(step2.pricing_model, missingValue),
        },
      ],
    },
    {
      title: t`Brief`,
      editStep: 3,
      rows: [
        { label: t`Nombre`, value: step3.name.trim() || missingValue },
        {
          label: t`Descripción`,
          value: step3.description.trim() || missingValue,
        },
        {
          label: t`URL objetivo`,
          value: step3.target_url.trim() || missingValue,
        },
        { label: t`Imagen`, value: step3.imageS3Key ?? missingValue },
      ],
    },
    {
      title: t`Audiencia`,
      editStep: 4,
      rows: [
        {
          label: t`Plataformas`,
          value: step4.platforms.length
            ? step4.platforms.join(', ')
            : missingValue,
        },
        {
          label: t`Intereses`,
          value: step4.interests.length
            ? step4.interests.join(', ')
            : missingValue,
        },
        { label: t`País`, value: step4.creator_country ?? missingValue },
        {
          label: t`Tier mínimo`,
          value: step4.min_creator_tier_slug ?? missingValue,
        },
      ],
    },
    {
      title: t`Compensación`,
      editStep: 5,
      rows: [
        {
          label: t`Tipo`,
          value: formatCompensationType(step5.compensation_type, missingValue),
        },
        {
          label: t`Notas`,
          value: step5.compensation_notes.trim() || t`Sin notas`,
        },
        {
          label: t`Reutilización de video`,
          value: step5.video_reuse_permission_default ? t`Sí` : t`No`,
        },
      ],
    },
    {
      title: t`Contenido`,
      editStep: 6,
      rows: [
        {
          label: t`Guidelines`,
          value: t`${step6.content_guidelines.trim().length} caracteres`,
        },
        {
          label: t`PDF del brief`,
          value: step6.briefPdfS3Key ?? t`Sin PDF`,
        },
      ],
    },
  ]
}

function formatContentType(
  value: CampaignWizardState['step1']['content_type'],
  missingValue: string,
) {
  if (value === 'influencer_posts') return t`Influencers Posts`
  return missingValue
}

function formatPricingModel(
  value: CampaignWizardState['step2']['pricing_model'],
  missingValue: string,
) {
  if (value === 'pay_per_post') return t`Pay per post`
  return missingValue
}

function formatCompensationType(
  value: CampaignWizardState['step5']['compensation_type'],
  missingValue: string,
) {
  if (value === 'payment') return t`Pago monetario`
  if (value === 'product_trade') return t`Canje de producto`
  if (value === 'payment_plus_product') return t`Pago + canje`
  return missingValue
}
