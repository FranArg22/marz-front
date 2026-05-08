import { createRef } from 'react'
import type { MutableRefObject } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrandSessionContext } from '#/features/identity/session/BrandSessionContext'
import type { BrandSession } from '#/features/identity/session/BrandSessionContext'
import { WizardStepValidationContext } from './validation'

type ValidateFn = () => Promise<boolean>

export function renderWithValidation(ui: React.ReactElement) {
  const validatorRef =
    createRef<ValidateFn | null>() as MutableRefObject<ValidateFn | null>
  validatorRef.current = null

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const brandSession: BrandSession = {
    account: {
      kind: 'brand',
      onboarding_status: 'complete',
      redirect_to: null,
      brand_workspace: {
        id: 'brand-workspace-1',
        name: 'Test Brand',
      },
    },
    brandWorkspace: {
      id: 'brand-workspace-1',
      name: 'Test Brand',
    },
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <BrandSessionContext.Provider value={brandSession}>
        <WizardStepValidationContext.Provider value={{ validatorRef }}>
          {ui}
        </WizardStepValidationContext.Provider>
      </BrandSessionContext.Provider>
    </QueryClientProvider>,
  )

  return { ...result, validatorRef }
}
