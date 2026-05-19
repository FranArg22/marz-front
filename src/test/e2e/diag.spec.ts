import { test } from './fixtures'
import { getClerkSessionToken } from './fixtures'

test('diag: trace navigation after signIn', async ({
  page,
  brandOnboardingUser,
}) => {
  console.log('[diag] clerkUserId =', brandOnboardingUser.clerkUserId)

  const navTrail: string[] = []
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navTrail.push(frame.url())
  })

  await brandOnboardingUser.signIn(page)
  console.log('[diag] url after signIn =', page.url())
  console.log('[diag] navTrail after signIn =', JSON.stringify(navTrail))

  await page.waitForLoadState('networkidle').catch(() => {})
  console.log('[diag] url after networkidle =', page.url())
  console.log('[diag] navTrail after networkidle =', JSON.stringify(navTrail))

  await page.goto('/onboarding/brand')
  console.log('[diag] url after goto /onboarding/brand =', page.url())
  console.log('[diag] navTrail final =', JSON.stringify(navTrail))

  const token = await getClerkSessionToken(page)
  const meRes = await page.request.get('http://localhost:50886/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  console.log('[diag] /v1/me from page =', meRes.status(), await meRes.text())
})
