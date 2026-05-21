import { test, expect } from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'

// E2E del flujo de chat bidireccional: brand y creator conectados a la misma
// conversation en navegadores separados, recibiendo mensajes vía WebSocket.
// Composer-only behaviors (counter, paste truncation, submit disabled) viven
// en MessageComposer.test.tsx — no se duplican acá.

const WS_TIMEOUT = 5_000

test.describe('chat send/receive bidireccional', () => {
  test('brand envía y creator recibe en tiempo real', async ({ chatPair }) => {
    const { conversationId, brandPage, creatorPage } = chatPair
    const brandChat = new ConversationPage(brandPage)
    const creatorChat = new ConversationPage(creatorPage)

    await brandChat.goto(conversationId)
    await creatorChat.goto(conversationId)

    const text = `brand→creator ${Date.now()}`
    await brandChat.sendMessage(text)

    await expect(creatorChat.messageByText(text)).toBeVisible({
      timeout: WS_TIMEOUT,
    })
  })

  test('creator envía y brand recibe en tiempo real', async ({ chatPair }) => {
    const { conversationId, brandPage, creatorPage } = chatPair
    const brandChat = new ConversationPage(brandPage)
    const creatorChat = new ConversationPage(creatorPage)

    await brandChat.goto(conversationId)
    await creatorChat.goto(conversationId)

    const text = `creator→brand ${Date.now()}`
    await creatorChat.sendMessage(text)

    await expect(brandChat.messageByText(text)).toBeVisible({
      timeout: WS_TIMEOUT,
    })
  })
})
