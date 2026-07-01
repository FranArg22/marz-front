import { t } from '@lingui/core/macro'
import { Download, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { SheetTitle } from '#/components/ui/sheet'
import type {
  CampaignBoardBriefSnapshot,
  CampaignBoardCommercialSnapshot,
  CampaignBoardTargetingSnapshot,
  CreatorCampaignBoardCard,
} from '#/shared/api/generated/model'

type SnapshotRecord = Record<string, unknown>

interface CampaignBriefContentProps {
  card: CreatorCampaignBoardCard
  brief: CampaignBoardBriefSnapshot
  targeting: CampaignBoardTargetingSnapshot
  commercial: CampaignBoardCommercialSnapshot
}

const deadlineFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function asRecord(value: unknown): SnapshotRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {}
  }

  return value as SnapshotRecord
}

function stringValue(record: SnapshotRecord, key: string): string | null {
  const value = record[key]
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function boolValue(record: SnapshotRecord, key: string): boolean | null {
  const value = record[key]
  return typeof value === 'boolean' ? value : null
}

function stringList(record: SnapshotRecord, key: string): string[] {
  const value = record[key]
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item !== 'string') return []
    const trimmed = item.trim()
    return trimmed.length > 0 ? [trimmed] : []
  })
}

function formatLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatContentType(value: string | null) {
  if (!value) return null
  if (value === 'influencer_posts') return t`Influencer`
  if (value === 'ugc_videos') return t`UGC`
  return formatLabel(value)
}

function formatCompensationType(value: string | null) {
  if (!value) return null
  if (value === 'payment') return t`Pago monetario`
  if (value === 'product_trade') return t`Canje de producto`
  if (value === 'payment_plus_product') return t`Pago + canje`
  return formatLabel(value)
}

function formatDeadline(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return deadlineFormatter.format(date)
}

function formatFeeRange(feeMin: string | null, feeMax: string | null) {
  if (feeMin && feeMax) {
    return feeMin === feeMax ? t`USD ${feeMin}` : t`USD ${feeMin} - ${feeMax}`
  }
  if (feeMin) return t`USD ${feeMin}`
  if (feeMax) return t`USD ${feeMax}`
  return null
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  )
}

function EmptyText() {
  return <p className="text-sm text-muted-foreground">{t`Sin información.`}</p>
}

function TextBlock({ value }: { value: string | null }) {
  if (!value) return <EmptyText />

  return <p className="text-sm leading-6 text-muted-foreground">{value}</p>
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <EmptyText />

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item}
          variant="outline"
          className="rounded-full px-2.5 py-1"
        >
          {formatLabel(item)}
        </Badge>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

export function CampaignBriefHeader({
  card,
  targeting,
}: {
  card: CreatorCampaignBoardCard
  targeting: CampaignBoardTargetingSnapshot
}) {
  const campaignRecord = asRecord(card.campaign)
  const brandRecord = asRecord(card.brand)
  const targetingRecord = asRecord(targeting)
  const imageUrl = stringValue(campaignRecord, 'image_url')
  const campaignName = stringValue(campaignRecord, 'name') ?? t`Campaña`
  const brandName = stringValue(brandRecord, 'name')
  const contentType = formatContentType(
    stringValue(targetingRecord, 'content_type') ??
      stringValue(campaignRecord, 'content_type'),
  )

  return (
    <div className="space-y-4">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="aspect-[16/9] w-full rounded-2xl object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="space-y-2">
        <SheetTitle className="text-xl font-semibold text-foreground">
          {campaignName}
        </SheetTitle>
        <div className="flex flex-wrap items-center gap-2">
          {brandName ? (
            <span className="text-sm text-muted-foreground">{brandName}</span>
          ) : null}
          {contentType ? (
            <Badge variant="secondary" className="rounded-full">
              {contentType}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function CampaignBriefContent({
  card,
  brief,
  targeting,
  commercial,
}: CampaignBriefContentProps) {
  const campaignRecord = asRecord(card.campaign)
  const briefRecord = asRecord(brief)
  const targetingRecord = asRecord(targeting)
  const commercialRecord = asRecord(commercial)

  const description = stringValue(campaignRecord, 'description')
  const targetURL = stringValue(campaignRecord, 'target_url')
  const deadline = formatDeadline(stringValue(campaignRecord, 'deadline'))

  const platforms = stringList(targetingRecord, 'platforms')
  const interests = stringList(targetingRecord, 'interests')
  const creatorCountry = stringValue(targetingRecord, 'creator_country')
  const minCreatorTier = stringValue(targetingRecord, 'min_creator_tier_slug')

  const compensationType = formatCompensationType(
    stringValue(commercialRecord, 'compensation_type'),
  )
  const compensationNotes = stringValue(commercialRecord, 'compensation_notes')
  const feeRange = formatFeeRange(
    card.targeting.fee_min,
    card.targeting.fee_max,
  )

  const contentGuidelines = stringValue(briefRecord, 'content_guidelines')
  const videoReuse = boolValue(
    commercialRecord,
    'video_reuse_permission_default',
  )
  const briefPDFURL = stringValue(briefRecord, 'brief_pdf_url')

  return (
    <div className="space-y-6">
      <Section title={t`Resumen`}>
        <div className="space-y-4 rounded-2xl border border-border p-4">
          <TextBlock value={description} />
          {targetURL ? (
            <Field label={t`Link de la campaña`}>
              <a
                href={targetURL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="break-all">{targetURL}</span>
              </a>
            </Field>
          ) : null}
          {deadline ? (
            <Field label={t`Fecha límite`}>
              <p className="text-sm text-muted-foreground">{deadline}</p>
            </Field>
          ) : null}
        </div>
      </Section>

      <Section title={t`Audiencia`}>
        <div className="space-y-4 rounded-2xl border border-border p-4">
          <Field label={t`Plataformas`}>
            <ChipList items={platforms} />
          </Field>
          <Field label={t`Intereses`}>
            <ChipList items={interests} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t`País`}>
              <TextBlock
                value={creatorCountry ? formatLabel(creatorCountry) : null}
              />
            </Field>
            <Field label={t`Tier mínimo de seguidores`}>
              <TextBlock
                value={minCreatorTier ? formatLabel(minCreatorTier) : null}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section title={t`Compensación`}>
        <div className="rounded-2xl border border-border p-4">
          <TextBlock value={compensationType} />
          {feeRange ? (
            <p className="mt-1 text-sm font-semibold text-foreground">
              {feeRange}
            </p>
          ) : null}
          {compensationNotes ? (
            <>
              <Separator className="my-3" />
              <p className="text-sm leading-6 text-muted-foreground">
                {compensationNotes}
              </p>
            </>
          ) : null}
        </div>
      </Section>

      <Section title={t`Contenido`}>
        <div className="space-y-4 rounded-2xl border border-border p-4">
          <Field label={t`Guías de contenido`}>
            <TextBlock value={contentGuidelines} />
          </Field>
          <Field label={t`Reutilización de video`}>
            <p className="text-sm text-muted-foreground">
              {videoReuse === null
                ? t`Sin información.`
                : videoReuse
                  ? t`Sí`
                  : t`No`}
            </p>
          </Field>
          {briefPDFURL ? (
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <a href={briefPDFURL} target="_blank" rel="noreferrer noopener">
                <Download className="size-4" aria-hidden="true" />
                {t`Descargar PDF del brief`}
              </a>
            </Button>
          ) : null}
        </div>
      </Section>
    </div>
  )
}
