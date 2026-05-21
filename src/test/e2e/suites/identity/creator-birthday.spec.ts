import { test, expect } from '../../support/fixtures'
import { CreatorOnboardingWizard } from '../../poms/onboarding/creator-wizard.pom'

test.describe('Creator onboarding — birthday screen', () => {
  test.beforeEach(async ({ page, creatorOnboardingUser }) => {
    await creatorOnboardingUser.signIn(page)
    const wizard = new CreatorOnboardingWizard(page)
    await wizard.gotoBirthday()
  })

  test('selecting day, then month, then year keeps all three values', async ({
    page,
  }) => {
    const wizard = new CreatorOnboardingWizard(page)

    await wizard.pickBirthdayOption(/Día/i, '5')
    await expect(wizard.birthdayTrigger(/Día/i)).toContainText('5')

    await wizard.pickBirthdayOption(/Mes/i, 'Marzo')
    await expect(wizard.birthdayTrigger(/Día/i)).toContainText('5')
    await expect(wizard.birthdayTrigger(/Mes/i)).toContainText('Marzo')

    const year = `${new Date().getFullYear() - 25}`
    await wizard.pickBirthdayOption(/Año/i, year)

    await expect(wizard.birthdayTrigger(/Día/i)).toContainText('5')
    await expect(wizard.birthdayTrigger(/Mes/i)).toContainText('Marzo')
    await expect(wizard.birthdayTrigger(/Año/i)).toContainText(year)

    await expect(wizard.continueButton).toBeEnabled()
  })

  test('selecting in month → day → year order also keeps all values', async ({
    page,
  }) => {
    const wizard = new CreatorOnboardingWizard(page)

    await wizard.pickBirthdayOption(/Mes/i, 'Julio')
    await expect(wizard.birthdayTrigger(/Mes/i)).toContainText('Julio')

    await wizard.pickBirthdayOption(/Día/i, '12')
    await expect(wizard.birthdayTrigger(/Mes/i)).toContainText('Julio')
    await expect(wizard.birthdayTrigger(/Día/i)).toContainText('12')

    const year = `${new Date().getFullYear() - 30}`
    await wizard.pickBirthdayOption(/Año/i, year)

    await expect(wizard.birthdayTrigger(/Día/i)).toContainText('12')
    await expect(wizard.birthdayTrigger(/Mes/i)).toContainText('Julio')
    await expect(wizard.birthdayTrigger(/Año/i)).toContainText(year)

    await expect(wizard.continueButton).toBeEnabled()
  })

  test('Continuar enables once a complete valid date is selected', async ({
    page,
  }) => {
    const wizard = new CreatorOnboardingWizard(page)
    await expect(wizard.continueButton).toBeDisabled()

    await wizard.fillBirthday('16', 'Junio', new Date().getFullYear() - 25)

    await expect(wizard.continueButton).toBeEnabled()
  })
})
