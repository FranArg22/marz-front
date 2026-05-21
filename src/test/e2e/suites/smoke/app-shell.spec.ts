import { test, expect } from '../../support/fixtures'
import { AppShell } from '../../poms/app-shell.pom'

const disabledBrandItems = ['Home', 'Creators', 'Analytics']

test.describe('App shell desktop', () => {
  test('brand onboarded sees brand sidebar and navigates to workspace and inbox', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/campaigns')
    const shell = new AppShell(page)

    await expect(page).toHaveURL(/\/campaigns/)
    await expect(shell.sidebar).toBeVisible()
    await expect(shell.navLink('Workspace')).toBeVisible()
    await expect(shell.navLink('Inbox')).toBeVisible()
    await expect(shell.navButton('Creators')).toBeVisible()

    await shell.clickNavLink('Workspace')
    await expect(page).toHaveURL(/\/workspace/)

    await shell.clickNavLink('Inbox')
    await expect(page).toHaveURL(/\/inbox/)

    for (const item of disabledBrandItems) {
      await shell.expectDisabledItemDoesNotNavigate(item)
    }
  })

  test('creator onboarded sees creator sidebar without brand-only items', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/offers')
    const shell = new AppShell(page)

    await expect(page).toHaveURL(/\/offers/)
    await expect(shell.sidebar).toBeVisible()
    await expect(shell.navLink('Workspace')).toBeVisible()
    await expect(shell.navLink('Inbox')).toBeVisible()
    await expect(shell.navButton('Campaigns')).toHaveCount(0)
    await expect(shell.navButton('Creators')).toHaveCount(0)

    await shell.clickNavLink('Workspace')
    await expect(page).toHaveURL(/\/workspace/)

    await shell.clickNavLink('Inbox')
    await expect(page).toHaveURL(/\/inbox/)

    await shell.expectDisabledItemDoesNotNavigate('Home')
    await shell.expectDisabledItemDoesNotNavigate('Analytics')
  })

  test('brand entering creator routes redirects to workspace', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/offers')
    await expect(page).toHaveURL(/\/workspace/)
  })

  test('creator entering brand routes redirects to workspace', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/campaigns')
    await expect(page).toHaveURL(/\/workspace/)
  })

  test('brand onboarding user redirects to brand onboarding shell', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/onboarding\/brand/)
  })

  test('creator onboarding user redirects to creator onboarding shell', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/onboarding\/creator/)
  })

  test('disabled shell actions do not emit analytics debug events', async ({
    page,
    onboardedBrandUser,
  }) => {
    const analyticsEvents: string[] = []
    page.on('console', (msg) => {
      if (msg.text().startsWith('[analytics]')) {
        analyticsEvents.push(msg.text())
      }
    })

    await onboardedBrandUser.signIn(page)
    await page.goto('/campaigns')
    const shell = new AppShell(page)
    await shell.expectDisabledItemDoesNotNavigate('Home')
    await shell.clickNavLink('Inbox')
    await expect(page).toHaveURL(/\/inbox/)

    expect(analyticsEvents).toHaveLength(0)
  })
})
