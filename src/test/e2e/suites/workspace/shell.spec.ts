import { test, expect } from '../../support/fixtures'
import { WorkspacePage } from '../../poms/workspace.pom'

test.describe('Workspace shell — estado vacío', () => {
  test('brand onboarded ve el shell del workspace con rail', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const ws = new WorkspacePage(page)
    await ws.goto()

    await expect(ws.shell).toHaveCount(1)
    await expect(ws.sidebar).toBeVisible()
    await expect(page.getByRole('button', { name: 'Creators' })).toBeVisible()
    await expect(ws.rail).toBeVisible()
    await expect(ws.search).toBeVisible()
    await expect(ws.filters).toBeVisible()
  })

  test('creator onboarded también accede al workspace (ruta unificada)', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    const ws = new WorkspacePage(page)
    await ws.goto()

    await expect(ws.shell).toHaveCount(1)
    await expect(ws.sidebar).toBeVisible()
    await expect(page.getByRole('button', { name: 'Creators' })).toHaveCount(0)
    await expect(ws.rail).toBeVisible()
  })

  test('cambiar tab de filtros sincroniza search params', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const ws = new WorkspacePage(page)
    await ws.goto()
    await ws.waitForRailLoaded()

    await ws.filterTab(/sin leer/i).click()
    await expect(page).toHaveURL(/filter=unread/)

    await ws.filterTab(/por responder/i).click()
    await expect(page).toHaveURL(/filter=needs_reply/)

    await ws.filterTab(/todas/i).click()
    await expect(page).not.toHaveURL(/filter=needs_reply/)
  })

  test('search debounced sincroniza a search param', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    const ws = new WorkspacePage(page)
    await ws.goto()
    await ws.waitForRailLoaded()

    await ws.fillSearch('hola')
    await expect(page).toHaveURL(/search=hola/, { timeout: 2_000 })
  })

  test('console del workspace queda sin errors propios', async ({
    page,
    onboardedBrandUser,
  }) => {
    const errors: Array<{ text: string; url?: string }> = []
    const failedUrls = new Set<string>()

    page.on('requestfailed', (req) => {
      failedUrls.add(req.url())
    })
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      // Chromium emits a generic "Failed to load resource: net::ERR_..." for
      // every failed network request; correlate it with the requestfailed
      // event to know which URL we're filtering.
      const text = msg.text()
      const matchedUrl = [...failedUrls].find((u) => text.includes(u))
      errors.push({ text, url: matchedUrl })
    })

    await onboardedBrandUser.signIn(page)
    const ws = new WorkspacePage(page)
    await ws.goto()
    await expect(ws.rail).toBeVisible()

    const ownErrors = errors.filter(({ text, url }) => {
      const lower = text.toLowerCase()
      if (lower.includes('clerk')) return false
      if (lower.includes('failed to fetch') && lower.includes('serverfn'))
        return false
      if (lower.includes('faro') && lower.includes('failed sending payload'))
        return false
      // "Failed to load resource" is a generic Chromium console line. The
      // origin is identified via requestfailed (url field). Drop the noise
      // from third-party / telemetry endpoints that don't impact UX.
      if (lower.includes('failed to load resource')) {
        const u = (url ?? '').toLowerCase()
        if (!u) return false // no correlated URL = can't reason about it
        if (u.includes('clerk')) return false
        if (u.includes('faro') || u.includes('grafana')) return false
        if (u.includes('analytics')) return false
        if (u.includes('serverfn')) return false
      }
      return true
    })
    expect(
      ownErrors,
      `unexpected console errors:\n${JSON.stringify(ownErrors, null, 2)}`,
    ).toHaveLength(0)
  })
})

test.describe('Workspace con conversación', () => {
  test('brand ve la conversación seedeada en el rail', async ({ chatPair }) => {
    const { brandPage } = chatPair
    const ws = new WorkspacePage(brandPage)
    await ws.goto()
    await ws.waitForRailLoaded()
    await ws.expectRailHasItems()
  })

  test('creator ve la conversación seedeada en el rail', async ({
    chatPair,
  }) => {
    const { creatorPage } = chatPair
    const ws = new WorkspacePage(creatorPage)
    await ws.goto()
    await ws.waitForRailLoaded()
    await ws.expectRailHasItems()
  })
})
