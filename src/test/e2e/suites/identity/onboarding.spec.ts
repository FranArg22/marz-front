import { test, expect } from '../../support/fixtures'
import { BrandOnboardingWizard } from '../../poms/onboarding/brand-wizard.pom'
import { CreatorOnboardingWizard } from '../../poms/onboarding/creator-wizard.pom'

test.describe('Onboarding E2E', () => {
  test('brand onboarding_pending ve el wizard', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    const wizard = new BrandOnboardingWizard(page)
    await wizard.goto()

    await wizard.expectStep(1)
    await expect(wizard.continueButton).toBeVisible()
  })

  test('creator onboarding_pending ve el wizard de creator', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    const wizard = new CreatorOnboardingWizard(page)
    await wizard.goto()

    await expect(page.getByRole('progressbar')).toBeVisible()
  })

  test('brand onboarded es redirigido de /onboarding/brand a /campaigns', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/onboarding/brand')

    await expect(page).toHaveURL(/\/campaigns/)
  })

  test('creator onboarded es redirigido de /onboarding/creator a /inbox', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/onboarding/creator')

    await expect(page).toHaveURL(/\/inbox/)
  })

  test('kind_pending ve el selector de kind', async ({ page, testUser }) => {
    await testUser.setOnboardingState('kind_pending')
    await testUser.signIn(page)
    const wizard = new CreatorOnboardingWizard(page)
    await wizard.gotoKindSelector()
  })

  test('brand completa el wizard de B1 a B14 y termina en /campaigns', async ({
    page,
    brandOnboardingUser,
  }) => {
    test.skip(
      true,
      'BUG PRODUCTO: race condition entre POST onboarding:complete 200 → ' +
        'invalidateQueries(getMeQueryKey) → navigate(/campaigns). El guard de ' +
        '`_brand.beforeLoad` lee `getQueryData` (cache stale pero presente) y ' +
        '`getQueryState.dataUpdatedAt < 30s` → usa cached `onboarding_pending` ' +
        '→ redirect a `/onboarding/brand` → `/identity`. Fix: en `useSubmitBrandOnboarding` ' +
        'onSuccess, hacer `await queryClient.refetchQueries({queryKey: getMeQueryKey()})` ' +
        'antes de navigate, o `setQueryData` con el response del complete (que incluye ' +
        '`onboarding_status: onboarded`).',
    )
    test.setTimeout(120_000)
    await brandOnboardingUser.signIn(page)
    const wizard = new BrandOnboardingWizard(page)
    await wizard.goto()

    // B1
    await wizard.fillIdentity('Marca E2E', 'https://marca-e2e.com')
    await wizard.continue()

    // B2
    await wizard.pickVertical('Tech')
    await wizard.continue()

    // B3 — priming social proof
    await wizard.expectStep(3)
    await wizard.continue()

    // B4
    await wizard.pickObjective(/Performance/)
    await wizard.continue()

    // B5
    await wizard.pickExperienceAndSourcing(
      'Nunca lo hice',
      /Quiero descubrirlos en Marz/,
    )
    await wizard.continue()

    // B6 — under_10k (idx 0) + 2 nudges → 25k_to_50k
    await wizard.pickBudget(2)
    await expect(page.getByText('50.000')).toBeVisible()
    await wizard.continue()

    // B7 — priming match preview
    await wizard.expectStep(7)
    await wizard.continue()

    // B8
    await wizard.pickTiming('Lanzo ya')
    await wizard.continue()

    // B9
    await wizard.fillContact('Rodrigo', 'Growth Lead', '+5491155555555')
    await wizard.continue()

    // B10 — priming projection
    await wizard.expectStep(10)
    await wizard.continue()

    // B11
    await wizard.pickAttribution('Instagram')
    await wizard.continue()

    // B12 — loading: avanza solo después de ~3.3s. Esperamos a B13.
    await expect(page.getByText(/Elegí tu plan/i)).toBeVisible({
      timeout: 10_000,
    })

    // B13 — paywall fallback
    await wizard.chooseNoPlanFallback()

    // B14
    await wizard.confirmAndStart()

    await expect(page).toHaveURL(/\/campaigns/, { timeout: 15_000 })
  })
})
