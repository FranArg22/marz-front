import { describe, it, expect } from 'vitest'
import { redirect } from '@tanstack/react-router'

async function callBeforeLoad() {
  const { Route } = await import('./billing')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: () => void
    }
  ).beforeLoad
  return beforeLoad()
}

describe('/_brand/billing beforeLoad', () => {
  it('redirects to the subscription settings URL path', async () => {
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/ajustes/suscripcion' }),
    )
  })
})
