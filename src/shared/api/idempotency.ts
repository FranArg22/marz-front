import { useRef } from 'react'

export function generateIdempotencyKey(): string {
  // crypto.randomUUID only exists in secure contexts (https / localhost). Dev
  // is served over http on .test hostnames, where it is undefined; fall back to
  // crypto.getRandomValues, which is available without a secure context.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0'))
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`
}

export function withIdempotencyKey(
  key: string,
  init?: RequestInit,
): RequestInit {
  return {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string>),
      'Idempotency-Key': key,
    },
  }
}

/**
 * Stable idempotency key per fingerprint: regenera la key solo cuando cambia
 * el fingerprint de los inputs. Para mutaciones que pueden reintentarse
 * (mismo input → misma key; input distinto → key nueva).
 */
export function useIdempotencyKey<TVariables>(
  fingerprintFor: (variables: TVariables) => string,
) {
  const ref = useRef<{ fingerprint: string; key: string } | null>(null)

  return {
    get: (variables: TVariables) => {
      const fingerprint = fingerprintFor(variables)
      if (ref.current?.fingerprint !== fingerprint) {
        ref.current = { fingerprint, key: generateIdempotencyKey() }
      }
      return ref.current.key
    },
    reset: () => {
      ref.current = null
    },
  }
}
