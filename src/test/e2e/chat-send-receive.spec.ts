import { test, expect } from './fixtures'

// E2E del flujo de chat bidireccional: brand y creator conectados a la misma
// conversation en navegadores separados, recibiendo mensajes vía WebSocket.
// Composer-only behaviors (counter, paste truncation, submit disabled) viven
// en MessageComposer.test.tsx — no se duplican acá.

const WS_TIMEOUT = 5_000

test.describe('chat send/receive bidireccional', () => {
  test('brand envía y creator recibe en tiempo real', async ({ chatPair }) => {
    const { conversationId, brandPage, creatorPage } = chatPair
    const route = `/workspace/conversations/${conversationId}`

    await brandPage.goto(route)
    await creatorPage.goto(route)
    await brandPage.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })
    await creatorPage.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const text = `brand→creator ${Date.now()}`
    const composer = brandPage.getByPlaceholder('Escribí un mensaje...')
    await composer.fill(text)
    await composer.press('Enter')

    await expect(
      creatorPage.locator('[role="article"]', { hasText: text }),
    ).toBeVisible({ timeout: WS_TIMEOUT })
  })

  test('creator envía y brand recibe en tiempo real', async ({ chatPair }) => {
    const { conversationId, brandPage, creatorPage } = chatPair
    const route = `/workspace/conversations/${conversationId}`

    await brandPage.goto(route)
    await creatorPage.goto(route)
    await brandPage.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })
    await creatorPage.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const text = `creator→brand ${Date.now()}`
    const composer = creatorPage.getByPlaceholder('Escribí un mensaje...')
    await composer.fill(text)
    await composer.press('Enter')

    await expect(
      brandPage.locator('[role="article"]', { hasText: text }),
    ).toBeVisible({ timeout: WS_TIMEOUT })
  })
})
