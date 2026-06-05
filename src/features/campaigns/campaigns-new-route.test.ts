import { describe, expect, it, vi } from 'vitest'
import { redirect } from '@tanstack/react-router'

import { useCampaignWizardStore } from './wizard/store'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  getMeQueryKey: () => ['/v1/me'],
}))

describe('/_brand/campaigns/new route', () => {
  it('validates the campaign wizard step search param', async () => {
    const { Route } = await import('#/routes/_brand/campaigns.new')
    const validateSearch = (
      Route.options as unknown as {
        validateSearch: (search: Record<string, unknown>) => unknown
      }
    ).validateSearch

    expect(validateSearch({})).toEqual({ step: 1 })
    expect(validateSearch({ step: 7 })).toEqual({ step: 7 })
    expect(() => validateSearch({ step: 8 })).toThrow()
  })

  it('redirects inaccessible steps back to step 1', async () => {
    const { Route } = await import('#/routes/_brand/campaigns.new')
    const beforeLoad = (
      Route.options as unknown as {
        beforeLoad: (options: { search: { step: number } }) => void
      }
    ).beforeLoad

    useCampaignWizardStore.setState({ completedSteps: [] })

    try {
      beforeLoad({ search: { step: 3 } })
      throw new Error('beforeLoad did not redirect')
    } catch (error) {
      expect(error).toEqual(
        redirect({ to: '/campaigns/new', search: { step: 1 } }),
      )
    }
  })
})
