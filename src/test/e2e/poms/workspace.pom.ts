import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Workspace shell (`/workspace`): app shell + sidebar + conversation rail
 * (search + filter tabs + list).
 */
export class WorkspacePage {
  readonly shell: Locator
  readonly sidebar: Locator
  readonly rail: Locator
  readonly search: Locator
  readonly filters: Locator

  constructor(public readonly page: Page) {
    this.shell = page.getByTestId('app-shell')
    this.sidebar = page.getByTestId('app-sidebar')
    this.rail = page.getByRole('region', { name: /conversaciones/i })
    this.search = page.getByRole('searchbox', {
      name: /buscar conversaciones/i,
    })
    this.filters = page.getByRole('tablist', {
      name: /filtrar conversaciones/i,
    })
  }

  async goto(): Promise<void> {
    await this.page.goto('/workspace')
    await expect(this.page).toHaveURL(/\/workspace/)
  }

  async waitForRailLoaded(timeoutMs = 30_000): Promise<void> {
    await expect(this.rail).toBeVisible()
    await expect(
      this.rail.getByRole('status', { name: /cargando conversaciones/i }),
    ).toHaveCount(0, { timeout: timeoutMs })
  }

  filterTab(name: RegExp | string): Locator {
    return this.page.getByRole('tab', { name })
  }

  async fillSearch(value: string): Promise<void> {
    await this.search.fill(value)
  }

  async expectRailHasItems(min = 1, timeoutMs = 5_000): Promise<void> {
    for (let i = 0; i < min; i += 1) {
      await expect(this.rail.getByRole('listitem').nth(i)).toBeVisible({
        timeout: timeoutMs,
      })
    }
  }
}
