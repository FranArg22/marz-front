import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_brand/campaigns/new/')({
  beforeLoad: () => {
    throw redirect({
      to: '/campaigns/new',
      search: { step: 1 },
    })
  },
})
