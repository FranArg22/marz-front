import { t } from '@lingui/core/macro'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function getMonthLabels() {
  return [
    t`ene`,
    t`feb`,
    t`mar`,
    t`abr`,
    t`may`,
    t`jun`,
    t`jul`,
    t`ago`,
    t`sep`,
    t`oct`,
    t`nov`,
    t`dic`,
  ] as const
}

export function formatRelativeTime(isoDate: string, now = Date.now()): string {
  const date = new Date(isoDate)
  const diff = now - date.getTime()

  if (diff < HOUR) {
    return t`${Math.max(1, Math.floor(diff / MINUTE))}m`
  }

  if (diff < DAY) {
    return t`${Math.floor(diff / HOUR)}h`
  }

  if (diff < 7 * DAY) {
    return t`${Math.floor(diff / DAY)}d`
  }

  const month = getMonthLabels()[date.getMonth()]
  return `${month} ${date.getDate()}`
}
