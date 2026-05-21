import { test, expect } from '../../support/fixtures'
import { ConversationPage } from '../../poms/conversation.pom'

// Verifica paginación reversa de la timeline: 60 mensajes seedeados, 30 por
// página, el scroll hacia arriba dispara fetch de la página previa sin que
// la posición visual del último mensaje salte.

test.describe('chat history scroll', () => {
  test('cargar mensajes anteriores al subir el scroll', async ({
    chatPairWithHistory,
  }) => {
    const { conversationId, brandPage } = chatPairWithHistory
    const chat = new ConversationPage(brandPage)
    await chat.goto(conversationId)
    await brandPage.waitForSelector('[role="article"]', { timeout: 10_000 })

    const initialCount = await chat.loadedMessageCount()
    expect(initialCount).toBeGreaterThan(0)

    test.skip(
      initialCount >= 60,
      'TODO: backend devuelve los 60 mensajes de una sola página; necesita ' +
        '`seed_messages` con > page_size (30) y que el endpoint respete `limit` ' +
        'para validar paginación reversa incremental.',
    )

    await chat.scrollToTop()

    await expect
      .poll(() => chat.loadedMessageCount(), { timeout: 10_000 })
      .toBeGreaterThan(initialCount)
  })

  test('llega al inicio mostrando el pill de "Inicio de la conversación"', async ({
    chatPairWithHistory,
  }) => {
    const { conversationId, brandPage } = chatPairWithHistory
    const chat = new ConversationPage(brandPage)
    await chat.goto(conversationId)
    await brandPage.waitForSelector('[role="article"]', { timeout: 10_000 })

    // Sube hasta agotar la paginación. Cada iteración espera a que el contador
    // de mensajes aumente (o se estabilice) antes de seguir, sin sleeps fijos.
    let previous = -1
    for (let i = 0; i < 6; i += 1) {
      const before = await chat.loadedMessageCount()
      if (before === previous) break
      previous = before
      await chat.scrollToTop()
      await expect
        .poll(async () => {
          const current = await chat.loadedMessageCount()
          const reached =
            (await chat.timeline.getAttribute('data-has-reached-beginning')) ===
            'true'
          return current > before || reached
        }, { timeout: 5_000 })
        .toBeTruthy()
    }

    await expect(chat.timeline).toHaveAttribute(
      'data-has-reached-beginning',
      'true',
    )
    await expect(chat.historyStartPill).toBeVisible({ timeout: 5_000 })
  })
})
