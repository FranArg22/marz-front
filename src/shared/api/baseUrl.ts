import { env } from '#/env'

export function getApiBaseUrl() {
  const internalBase =
    typeof window === 'undefined'
      ? process.env.MARZ_INTERNAL_API_URL
      : undefined
  return (internalBase || env.VITE_API_URL).replace(/\/$/, '')
}
