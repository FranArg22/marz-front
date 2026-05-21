import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Conversation page: chat timeline, composer, and history scroll.
 * Mounted at `/workspace/conversations/:id`.
 */
export class ConversationPage {
  readonly timeline: Locator
  readonly scroller: Locator
  readonly composer: Locator
  readonly historyStartPill: Locator

  constructor(public readonly page: Page) {
    this.timeline = page.locator('[data-testid="message-timeline"]')
    this.scroller = page.locator('[data-testid="message-timeline-scroller"]')
    this.composer = page.getByPlaceholder('Escribí un mensaje...')
    this.historyStartPill = page.getByText(/inicio de la conversación/i)
  }

  async loadedMessageCount(): Promise<number> {
    return Number(
      await this.timeline.getAttribute('data-loaded-message-count'),
    )
  }

  async scrollToTop(): Promise<void> {
    await this.scroller.evaluate((el) => {
      el.scrollTop = 0
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
  }

  async goto(conversationId: string): Promise<void> {
    await this.page.goto(`/workspace/conversations/${conversationId}`)
    await this.waitForReady()
  }

  async waitForReady(timeoutMs = 10_000): Promise<void> {
    await this.timeline.waitFor({ state: 'visible', timeout: timeoutMs })
  }

  async sendMessage(text: string): Promise<void> {
    await this.composer.fill(text)
    await this.composer.press('Enter')
  }

  messageByText(text: string | RegExp): Locator {
    return this.page.locator('[role="article"]', { hasText: text })
  }

  async expectTimelineContains(
    text: string | RegExp,
    timeoutMs = 5_000,
  ): Promise<void> {
    await expect(this.timeline.getByText(text)).toBeVisible({
      timeout: timeoutMs,
    })
  }
}
