import { redirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

async function callBeforeLoad() {
  const { Route } = await import('./ajustes.index')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: () => void
    }
  ).beforeLoad
  return beforeLoad()
}

describe('/_brand/ajustes/ beforeLoad', () => {
  it('redirects to the general settings URL path', async () => {
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/ajustes/general' }),
    )
  })
})
