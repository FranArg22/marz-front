import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'

import { getBrandWorkspaceLandingTarget } from '#/shared/api/generated/identity/identity'

export type BrandWorkspaceLandingTarget = 'dashboard' | 'create_campaign'

export const getServerBrandWorkspaceLandingTarget = createServerFn({
  method: 'GET',
}).handler(async (): Promise<BrandWorkspaceLandingTarget> => {
  const authObject = await auth()
  const token = await authObject.getToken()

  if (!token) return 'dashboard'

  try {
    const res = await getBrandWorkspaceLandingTarget({
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 200) return res.data.target
  } catch {
    // Default to dashboard if the landing-target endpoint fails.
  }

  return 'dashboard'
})
