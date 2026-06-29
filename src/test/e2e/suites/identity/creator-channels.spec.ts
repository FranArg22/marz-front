import { test, expect } from '../../support/fixtures'
import { CreatorOnboardingWizard } from '../../poms/onboarding/creator-wizard.pom'

/**
 * Reproduces three bugs reported on the C7 channels screen:
 *
 * 1. With many channels, the wizard <main> uses justify-center over
 *    overflow-y-auto, so when content exceeds the viewport the top of the
 *    list is clipped above the scroll origin and becomes unreachable.
 * 2. When a rate card has no amount, the field shows no destructive styling.
 * 3. "Continuar" must be disabled if any rate card is missing its amount.
 */
test.describe('Creator onboarding — channels screen', () => {
  test.beforeEach(async ({ page, creatorOnboardingUser }) => {
    await creatorOnboardingUser.signIn(page)
    const wizard = new CreatorOnboardingWizard(page)
    await wizard.gotoChannels()
  })

  test('first channel header remains reachable via scroll when content overflows', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 400 })
    const wizard = new CreatorOnboardingWizard(page)

    // 3 platforms max → 3 channels.
    await wizard.addChannel()
    await wizard.addChannel()
    await wizard.addChannel()
    await expect(wizard.addChannelButton()).toBeDisabled()

    await wizard.scrollChannelsToTop()
    await expect(wizard.channelHeaders().first()).toBeInViewport()
  })

  test('Agregar canal disables once all 3 platforms are taken', async ({
    page,
  }) => {
    const wizard = new CreatorOnboardingWizard(page)

    await wizard.addChannel()
    await wizard.addChannel()
    await wizard.addChannel()
    await expect(wizard.addChannelButton()).toBeDisabled()

    await expect(wizard.channelHeaders()).toContainText([
      'Instagram',
      'TikTok',
      'YouTube',
    ])
  })

  test('rate card with empty amount marks the input as invalid', async ({
    page,
  }) => {
    const wizard = new CreatorOnboardingWizard(page)

    await wizard.addChannel()
    await wizard.expandChannel(/Instagram/)

    const amount = wizard.firstAmountInput()
    await expect(amount).toBeVisible()
    await expect(amount).toHaveAttribute('aria-invalid', 'true')
  })

  test('Continuar is disabled while any channel is missing its handle', async ({
    page,
  }) => {
    const wizard = new CreatorOnboardingWizard(page)
    await wizard.addChannel()

    await expect(wizard.continueButton).toBeDisabled()

    await wizard.firstHandleInput().fill('mi_handle')
    await expect(wizard.continueButton).toBeEnabled()
  })

  test('Continuar is disabled while any rate card is missing its amount', async ({
    page,
  }) => {
    const wizard = new CreatorOnboardingWizard(page)
    await wizard.addChannel()

    await wizard.firstHandleInput().fill('mi_handle')

    await expect(wizard.continueButton).toBeDisabled()

    await wizard.firstAmountInput().fill('100')
    await expect(wizard.continueButton).toBeEnabled()
  })
})
