import type {
  CreatorEarningsPaymentRowKind,
  CreatorEarningsPeriod,
} from '#/shared/api/generated/model'
import { track } from '#/shared/analytics/track'

export type EarningsPeriodChangedPayload = Record<string, unknown> & {
  from: CreatorEarningsPeriod
  to: CreatorEarningsPeriod
}

export type EarningsPaymentSearchUsedPayload = Record<string, unknown> & {
  q: string
}

export type EarningsCsvExportedPayload = Record<string, unknown> & {
  period: CreatorEarningsPeriod
  q?: string
  truncated: boolean
  row_count?: number
}

export type EarningsBonusOpenedPayload = Record<string, unknown> & {
  bonus_id: string
  offer_id: string
  conversation_id: string
}

export type EarningsPaymentOpenedPayload = Record<string, unknown> & {
  payment_kind: CreatorEarningsPaymentRowKind
  conversation_id: string
}

export function trackEarningsViewed(): void {
  track('earnings_viewed')
}

export function trackEarningsPeriodChanged(
  payload: EarningsPeriodChangedPayload,
): void {
  track('earnings_period_changed', payload)
}

export function trackEarningsPaymentSearchUsed(
  payload: EarningsPaymentSearchUsedPayload,
): void {
  track('earnings_payment_search_used', payload)
}

export function trackEarningsCsvExported(
  payload: EarningsCsvExportedPayload,
): void {
  track('earnings_csv_exported', payload)
}

export function trackEarningsBonusOpened(
  payload: EarningsBonusOpenedPayload,
): void {
  track('earnings_bonus_opened', payload)
}

export function trackEarningsPaymentOpened(
  payload: EarningsPaymentOpenedPayload,
): void {
  track('earnings_payment_opened', payload)
}

export type WithdrawalRequestedPayload = Record<string, unknown> & {
  gross_amount: string
  fee_amount: string
  net_amount: string
  currency: string
}

export type WithdrawalStateChangedPayload = Record<string, unknown> & {
  withdrawal_id: string
  new_status: string
}

export type WithdrawalCancelledPayload = Record<string, unknown> & {
  withdrawal_id: string
}

export function trackWithdrawalRequested(
  payload: WithdrawalRequestedPayload,
): void {
  track('withdrawal_requested', payload)
}

export function trackWithdrawalStateChanged(
  payload: WithdrawalStateChangedPayload,
): void {
  track('withdrawal_state_changed', payload)
}

export function trackWithdrawalCancelled(
  payload: WithdrawalCancelledPayload,
): void {
  track('withdrawal_cancelled', payload)
}

export function trackW8benRedirectClicked(): void {
  track('w8ben_redirect_clicked')
}
