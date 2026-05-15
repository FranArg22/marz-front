import { t } from '@lingui/core/macro'

import type {
  OfferSnapshot as GeneratedOfferSnapshotV3,
  PaymentMarkedSnapshot as GeneratedPaymentMarkedSnapshotV3,
} from '#/shared/api/generated/model'
import { formatOfferAmount } from '#/shared/utils/formatOfferAmount'

export type OfferSnapshotV3 = GeneratedOfferSnapshotV3 & {
  offer_mode?: string
  tentative_publish_date?: string | null
  offer_deadline?: string | null
  currency?: string
  campaign_name?: string
}

export type OfferCancelledPhase = 'pre_accept' | 'post_accept'

export interface OfferEventSnapshotV3 {
  id: string
  type: 'single' | 'bundle' | 'multistage'
  amount: string
  currency?: string
  deadline: string | null
  expiresAt: string | null
  tentativePublishDate: string | null
  platforms: string[]
  deliverablesCount: number
  acceptedAt?: string
  rejectedAt?: string
  expiredAt?: string
  cancelledAt?: string
  phase?: OfferCancelledPhase
}

export type PaymentMarkedSnapshotV3 = GeneratedPaymentMarkedSnapshotV3 & {
  platforms?: string[]
  deliverables_count?: number
}

export interface PaymentMarkedEventSnapshotV3 {
  declaredPaymentId: string
  amount: string
  currency: string
  declaredAt: string
  platforms: string[]
  deliverablesCount: number
}

export const eventDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function extractSnapshotRecord(
  payload: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!payload) return null
  const snapshot = payload['snapshot']
  return isRecord(snapshot) ? snapshot : payload
}

export function extractOfferSnapshotV3(
  payload: Record<string, unknown> | null,
): OfferEventSnapshotV3 | null {
  const snapshot = extractSnapshotRecord(payload)
  if (!snapshot) return null

  const id = getString(snapshot['id']) ?? getString(snapshot['offer_id'])
  const type =
    getOfferType(snapshot['offer_mode']) ?? getOfferType(snapshot['type'])
  const amount =
    getString(snapshot['amount']) ?? getString(snapshot['total_amount'])
  if (!id || !type || !amount) return null

  const deliverables = getRecords(snapshot['deliverables'])
  const platformsFromField = getStrings(snapshot['platforms'])
  const platforms =
    platformsFromField.length > 0
      ? platformsFromField
      : uniqueStrings([
          getString(snapshot['platform']),
          getRecord(snapshot['deliverable'])?.['platform'],
          ...deliverables.map((deliverable) => deliverable['platform']),
        ])

  return {
    id,
    type,
    amount,
    currency: getString(snapshot['currency']) ?? undefined,
    deadline:
      getString(snapshot['offer_deadline']) ?? getString(snapshot['deadline']),
    expiresAt: getString(snapshot['expires_at']),
    tentativePublishDate:
      getString(snapshot['tentative_publish_date']) ??
      getString(snapshot['deadline']),
    platforms,
    deliverablesCount: resolveDeliverablesCount(snapshot, deliverables.length),
    acceptedAt: getString(snapshot['accepted_at']) ?? undefined,
    rejectedAt: getString(snapshot['rejected_at']) ?? undefined,
    expiredAt: getString(snapshot['expired_at']) ?? undefined,
    cancelledAt: getString(snapshot['cancelled_at']) ?? undefined,
    phase: getCancelledPhase(snapshot['phase']),
  }
}

export function extractPaymentMarkedSnapshotV3(
  payload: Record<string, unknown> | null,
): PaymentMarkedEventSnapshotV3 | null {
  const snapshot = extractSnapshotRecord(payload)
  if (!snapshot) return null
  if (snapshot['event_type'] !== 'PaymentMarked') return null

  const declaredPaymentId = getString(snapshot['declared_payment_id'])
  const amount = getString(snapshot['amount'])
  const currency = getString(snapshot['currency'])
  const declaredAt = getString(snapshot['declared_at'])
  if (!declaredPaymentId || !amount || !currency || !declaredAt) return null

  return {
    declaredPaymentId,
    amount,
    currency,
    declaredAt,
    platforms: getStrings(snapshot['platforms']),
    deliverablesCount: resolveDeliverablesCount(snapshot, 1),
  }
}

export function formatSnapshotAmount(amount: string, currency?: string) {
  return currency ? formatOfferAmount(amount, currency) : amount
}

export function formatSnapshotDate(iso: string) {
  // Snapshot dates are backend ISO strings; this is deterministic formatting, not current-time rendering.
  return eventDateFormatter.format(new Date(iso))
}

export function formatOfferMode(type: OfferEventSnapshotV3['type']) {
  if (type === 'single') return t`Individual`
  if (type === 'bundle') return t`Bundle`
  return t`Por etapas`
}

export function formatPlatforms(platforms: string[]) {
  if (platforms.length === 0) return t`Sin plataformas`
  return platforms.join(', ')
}

function resolveDeliverablesCount(
  snapshot: Record<string, unknown>,
  fallback: number,
) {
  const explicitCount = getNumber(snapshot['deliverables_count'])
  if (explicitCount !== null) return explicitCount
  return fallback
}

function getOfferType(value: unknown): OfferEventSnapshotV3['type'] | null {
  if (value === 'single' || value === 'bundle' || value === 'multistage') {
    return value
  }
  return null
}

function getCancelledPhase(value: unknown): OfferCancelledPhase | undefined {
  if (value === 'pre_accept' || value === 'post_accept') return value
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null
}

function getRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function getStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function uniqueStrings(values: unknown[]) {
  return [
    ...new Set(
      values.filter((value): value is string => typeof value === 'string'),
    ),
  ]
}
