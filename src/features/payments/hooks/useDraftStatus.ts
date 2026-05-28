import { useEffect, useState } from 'react'

import type { OfferDraftStatusStatus } from '#/shared/api/generated/model'
import { useGetOfferDraftStatus } from '#/shared/api/generated/offers/offers'

const TIMEOUT_MS = 30_000
const POLL_INTERVAL_MS = 2_000

const TERMINAL_STATUSES = new Set<OfferDraftStatusStatus>([
  'sent',
  'failed',
  'canceled',
])

interface UseDraftStatusOptions {
  offerDraftId: string
  enabled?: boolean
}

export function useDraftStatus({
  offerDraftId,
  enabled = true,
}: UseDraftStatusOptions) {
  const [timedOut, setTimedOut] = useState(false)

  const query = useGetOfferDraftStatus(offerDraftId, {
    query: {
      enabled,
      refetchInterval: (query) => {
        const response = query.state.data
        const status =
          response?.status === 200 ? response.data.status : undefined
        const isTerminal = status ? TERMINAL_STATUSES.has(status) : false

        if (timedOut || isTerminal) return false
        return POLL_INTERVAL_MS
      },
    },
  })

  const data = query.data?.status === 200 ? query.data.data : undefined
  const status = data?.status
  const isTerminal = status ? TERMINAL_STATUSES.has(status) : false

  useEffect(() => {
    if (!enabled) return

    const timer = setTimeout(() => {
      setTimedOut(true)
    }, TIMEOUT_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [enabled, offerDraftId])

  return {
    data,
    status,
    isTerminal,
    timedOut,
    isLoading: query.isLoading,
  }
}
