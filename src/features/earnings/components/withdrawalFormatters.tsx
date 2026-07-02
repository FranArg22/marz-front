import { Trans } from '@lingui/react/macro'

import { Badge } from '#/components/ui/badge'

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatMoney(amount: string): string {
  return currencyFormatter.format(Number(amount))
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'requested':
      return (
        <Badge variant="secondary">
          <Trans>En cola</Trans>
        </Badge>
      )
    case 'sent':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <Trans>Enviado ✓</Trans>
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="destructive">
          <Trans>Falló</Trans>
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="secondary">
          <Trans>Cancelado</Trans>
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
