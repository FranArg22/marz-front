import { t } from '@lingui/core/macro'

import type { MessageItem } from '../types'

export interface DaySeparatorItem {
  kind: 'day-separator'
  label: string
  date: string
}

export interface MessageTimelineItem {
  kind: 'message'
  message: MessageItem
}

export type TimelineItem = DaySeparatorItem | MessageTimelineItem

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

function formatDayLabel(date: Date, today: Date): string {
  const todayStr = toLocalDateString(today)
  const dateStr = toLocalDateString(date)

  if (dateStr === todayStr) {
    return t`Hoy`
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === toLocalDateString(yesterday)) {
    return t`Ayer`
  }

  const day = date.getDate()
  const month = getMonthLabels()[date.getMonth()]
  return `${day} ${month}`
}

function toLocalDateString(date: Date): string {
  return date.toLocaleDateString('sv')
}

export function groupByDay(
  messages: MessageItem[],
  now?: Date,
): TimelineItem[] {
  if (messages.length === 0) return []

  const today = now ?? new Date()
  const items: TimelineItem[] = []
  let currentDateStr = ''

  for (const message of messages) {
    const messageDate = new Date(message.created_at)
    const dateStr = toLocalDateString(messageDate)

    if (dateStr !== currentDateStr) {
      currentDateStr = dateStr
      items.push({
        kind: 'day-separator',
        label: formatDayLabel(messageDate, today),
        date: dateStr,
      })
    }

    items.push({ kind: 'message', message })
  }

  return items
}

export interface GroupedTimeline {
  groups: { label: string; date: string }[]
  groupCounts: number[]
  messages: MessageItem[]
}

export function groupByDayGrouped(
  messages: MessageItem[],
  now?: Date,
): GroupedTimeline {
  const today = now ?? new Date()
  const groups: { label: string; date: string }[] = []
  const groupCounts: number[] = []
  let currentDateStr = ''

  for (const message of messages) {
    const messageDate = new Date(message.created_at)
    const dateStr = toLocalDateString(messageDate)

    if (dateStr !== currentDateStr) {
      currentDateStr = dateStr
      groups.push({ label: formatDayLabel(messageDate, today), date: dateStr })
      groupCounts.push(0)
    }
    groupCounts[groupCounts.length - 1]! += 1
  }

  return { groups, groupCounts, messages }
}
