import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_brand/ajustes/')({
  beforeLoad: () => {
    throw redirect({ to: '/ajustes/general' })
  },
})
