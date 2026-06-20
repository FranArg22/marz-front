import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_creator/offers')({
  beforeLoad: () => {
    throw redirect({ to: '/inbox' })
  },
})
