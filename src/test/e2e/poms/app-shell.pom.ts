import { expect, type Locator, type Page } from '@playwright/test'

/**
 * App shell: top-level layout with sidebar nav. Available after onboarding,
 * for both brand and creator (kind-aware items rendered/disabled by guard).
 */
export class AppShell {
  readonly shell: Locator
  readonly sidebar: Locator

  constructor(public readonly page: Page) {
    this.shell = page.getByTestId('app-shell')
    this.sidebar = page.getByTestId('app-sidebar')
  }

  navLink(name: string): Locator {
    return this.page.getByRole('link', { name })
  }

  navButton(name: string): Locator {
    return this.page.getByRole('button', { name })
  }

  async clickNavLink(name: string): Promise<void> {
    await this.navLink(name).click()
  }

  async expectDisabledItemDoesNotNavigate(name: string): Promise<void> {
    const urlBefore = this.page.url()
    const item = this.navButton(name)
    await expect(item).toBeDisabled()
    await item.dispatchEvent('click')
    await expect(this.page).toHaveURL(urlBefore)
  }
}
